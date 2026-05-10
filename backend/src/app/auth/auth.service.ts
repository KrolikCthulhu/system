import {
	BadRequestException,
	ConflictException,
	ForbiddenException,
	Injectable,
	Logger,
	UnauthorizedException
} from '@nestjs/common';
import { JsonWebTokenError, TokenExpiredError } from '@nestjs/jwt';
import { AuthSession, Prisma, User } from '@prisma/generated';
import { MailService } from '../mail/mail.service';
import { UsersService } from '../users/users.service';
import {
	AuthenticatedUser,
	AuthResponse,
	RefreshTokenPayload
} from './auth.types';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ResendVerificationDto } from './dto/resend-verification.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { EmailVerificationService } from './email-verification.service';
import { PasswordService } from './password.service';
import { SessionService } from './session.service';
import { TokenService } from './token.service';

const AUTH_RESPONSES = {
	genericRegistration: {
		message: 'If the account can be registered, further instructions have been sent.'
	},
	registered: {
		message: 'Account has been created successfully.'
	},
	verifyEmail: {
		message: 'Check your email to verify your account.'
	},
	emailVerified: {
		message: 'Email has been verified successfully.'
	}
} as const;

interface RequestContext {
	ipAddress?: string;
	userAgent?: string;
}

@Injectable()
export class AuthService {
	private readonly logger = new Logger(AuthService.name);

	constructor(
		private readonly usersService: UsersService,
		private readonly sessionService: SessionService,
		private readonly tokenService: TokenService,
		private readonly passwordService: PasswordService,
		private readonly mailService: MailService,
		private readonly emailVerificationService: EmailVerificationService
	) {}

	async register(dto: RegisterDto) {
		const email = this.normalizeEmail(dto.email);
		const { username, displayUsername } = this.normalizeUsername(dto.username);
		const password = dto.password;

		const [existingByEmail, existingByUsername] = await Promise.all([
			this.usersService.findByEmail(email),
			this.usersService.findByUsername(username)
		]);

		if (
			existingByUsername &&
			(!existingByEmail || existingByUsername.id !== existingByEmail.id)
		) {
			throw new ConflictException('Username is already taken.');
		}

		if (existingByEmail) {
			if (
				this.tokenService.isEmailVerificationEnabled() &&
				!existingByEmail.isEmailVerified
			) {
				await this.sendVerificationIfAllowed(existingByEmail.id, existingByEmail.email);
			}

			return this.tokenService.isEmailVerificationEnabled()
				? AUTH_RESPONSES.genericRegistration
				: AUTH_RESPONSES.registered;
		}

		const passwordHash = await this.passwordService.hash(password);

		try {
			const user = await this.usersService.create({
				email,
				username,
				displayUsername,
				passwordHash,
				isEmailVerified: !this.tokenService.isEmailVerificationEnabled()
			});

			if (this.tokenService.isEmailVerificationEnabled()) {
				await this.sendVerificationSafely(user.id, user.email);
				return AUTH_RESPONSES.verifyEmail;
			}

			return AUTH_RESPONSES.registered;
		} catch (error) {
			this.handleRegistrationPersistenceError(error);
		}
	}

	async verifyEmail(dto: VerifyEmailDto) {
		if (!this.tokenService.isEmailVerificationEnabled()) {
			return AUTH_RESPONSES.emailVerified;
		}

		const token = dto.token?.trim();

		if (!token) {
			throw new BadRequestException('Verification token is required.');
		}

		try {
			const payload = await this.tokenService.verifyEmailVerificationToken(token);

			if (payload.type !== 'email-verification') {
				throw new BadRequestException('Verification token is invalid.');
			}

			const tokenHash = this.tokenService.hashToken(token);
			const verificationRecord =
				await this.emailVerificationService.findActiveByTokenHash(tokenHash);

			if (!verificationRecord || verificationRecord.userId !== payload.sub) {
				throw new BadRequestException('Verification token is invalid or expired.');
			}

			if (verificationRecord.user.isEmailVerified) {
				await this.emailVerificationService.markAsUsed(verificationRecord.id);
				return AUTH_RESPONSES.emailVerified;
			}

			await this.emailVerificationService.consumeToken(
				verificationRecord.id,
				verificationRecord.userId
			);

			return AUTH_RESPONSES.emailVerified;
		} catch (error) {
			if (error instanceof BadRequestException) {
				throw error;
			}

			if (error instanceof TokenExpiredError || error instanceof JsonWebTokenError) {
				throw new BadRequestException('Verification token is invalid or expired.');
			}

			throw error;
		}
	}

	async resendVerification(dto: ResendVerificationDto) {
		if (!this.tokenService.isEmailVerificationEnabled()) {
			return AUTH_RESPONSES.genericRegistration;
		}

		const email = this.normalizeEmail(dto.email);
		const user = await this.usersService.findByEmail(email);

		if (!user || user.isEmailVerified) {
			return AUTH_RESPONSES.genericRegistration;
		}

		await this.sendVerificationIfAllowed(user.id, user.email);

		return AUTH_RESPONSES.genericRegistration;
	}

	async login(dto: LoginDto, context: RequestContext = {}): Promise<AuthResponse> {
		const email = this.normalizeEmail(dto.email);
		const user = await this.usersService.findByEmail(email);

		if (!user) {
			throw new UnauthorizedException('Invalid email or password.');
		}

		const isPasswordValid = await this.passwordService.verify(
			user.passwordHash,
			dto.password
		);

		if (!isPasswordValid) {
			throw new UnauthorizedException('Invalid email or password.');
		}

		this.assertUserCanAuthenticate(user);

		const sessionId = this.tokenService.createSessionId();
		const familyId = this.tokenService.createSessionFamilyId();
		const refreshToken = await this.tokenService.createRefreshToken({
			userId: user.id,
			sessionId,
			familyId
		});
		const refreshTokenHash = this.tokenService.hashToken(refreshToken);

		await this.sessionService.createSession({
			id: sessionId,
			userId: user.id,
			tokenHash: refreshTokenHash,
			familyId,
			expiresAt: this.tokenService.getRefreshTokenExpiresAt(),
			ipAddress: context.ipAddress,
			userAgent: context.userAgent
		});

		const accessToken = await this.tokenService.createAccessToken({
			userId: user.id,
			email: user.email,
			username: user.username,
			displayUsername: user.displayUsername,
			role: user.role,
			sessionId
		});

		return this.buildAuthResponse(user, accessToken, refreshToken);
	}

	async refresh(
		refreshToken: string | null,
		context: RequestContext = {}
	): Promise<AuthResponse> {
		if (!refreshToken) {
			throw new UnauthorizedException('Refresh token is required.');
		}

		try {
			const currentSession = await this.resolveRefreshSession(refreshToken);

			const user = await this.usersService.findById(currentSession.userId);

			if (!user) {
				throw new UnauthorizedException('Refresh token is invalid or expired.');
			}

			this.assertUserCanAuthenticate(user);

			const nextSessionId = this.tokenService.createSessionId();
			const nextRefreshToken = await this.tokenService.createRefreshToken({
				userId: user.id,
				sessionId: nextSessionId,
				familyId: currentSession.familyId
			});
			const nextRefreshTokenHash = this.tokenService.hashToken(nextRefreshToken);

			await this.sessionService.rotateSession(currentSession.id, {
				id: nextSessionId,
				userId: user.id,
				tokenHash: nextRefreshTokenHash,
				familyId: currentSession.familyId,
				parentId: currentSession.id,
				expiresAt: this.tokenService.getRefreshTokenExpiresAt(),
				ipAddress: context.ipAddress,
				userAgent: context.userAgent
			});

			const accessToken = await this.tokenService.createAccessToken({
				userId: user.id,
				email: user.email,
				username: user.username,
				displayUsername: user.displayUsername,
				role: user.role,
				sessionId: nextSessionId
			});

			return this.buildAuthResponse(user, accessToken, nextRefreshToken);
		} catch (error) {
			if (
				error instanceof UnauthorizedException ||
				error instanceof ForbiddenException
			) {
				throw error;
			}

			if (error instanceof TokenExpiredError || error instanceof JsonWebTokenError) {
				throw new UnauthorizedException('Refresh token is invalid or expired.');
			}

			throw error;
		}
	}

	async logout(user: AuthenticatedUser, refreshToken: string | null) {
		if (!refreshToken) {
			await this.sessionService.revokeSession(user.sessionId).catch(() => null);
			return;
		}

		try {
			const payload = await this.tokenService.verifyRefreshToken(refreshToken);
			const session = await this.sessionService.findById(payload.sessionId);

			if (!session || session.userId !== user.id) {
				await this.sessionService.revokeSession(user.sessionId).catch(() => null);
				return;
			}

			const refreshTokenHash = this.tokenService.hashToken(refreshToken);

			if (session.tokenHash !== refreshTokenHash) {
				await this.sessionService.revokeFamily(session.familyId);
				return;
			}

			if (!session.revokedAt) {
				await this.sessionService.revokeSession(session.id);
			}
		} catch (error) {
			if (error instanceof TokenExpiredError || error instanceof JsonWebTokenError) {
				await this.sessionService.revokeSession(user.sessionId).catch(() => null);
				return;
			}

			throw error;
		}
	}

	async logoutAll(user: AuthenticatedUser) {
		await this.sessionService.revokeAllForUser(user.id);
	}

	private normalizeEmail(value: string) {
		return value.trim().toLowerCase();
	}

	private normalizeUsername(value: string) {
		const originalUsername = value.trim();

		const displayUsername = originalUsername;

		return {
			username: originalUsername.toLowerCase(),
			displayUsername
		};
	}

	private async sendVerificationIfAllowed(userId: string, email: string) {
		const activeToken =
			await this.emailVerificationService.findLatestActiveTokenByUserId(userId);

		if (activeToken && this.emailVerificationService.shouldThrottleResend(activeToken)) {
			return;
		}

		await this.sendVerification(userId, email);
	}

	private async sendVerification(userId: string, email: string) {
		const verificationToken = await this.emailVerificationService.issueToken({
			userId,
			email
		});

		await this.mailService.sendEmailVerification({
			email,
			verificationUrl: verificationToken.verificationUrl
		});
	}

	private async sendVerificationSafely(userId: string, email: string) {
		try {
			await this.sendVerification(userId, email);
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Unknown mail error';
			this.logger.error(
				`Failed to send verification email for user ${userId} (${email}): ${message}`
			);
		}
	}

	private handleRegistrationPersistenceError(error: unknown): never {
		if (
			error instanceof Prisma.PrismaClientKnownRequestError &&
			error.code === 'P2002'
		) {
			const target = Array.isArray(error.meta?.target) ? error.meta.target : [];

			if (target.includes('username')) {
				throw new ConflictException('Username is already taken.');
			}

			return this.throwGenericRegistrationConflict();
		}

		throw error;
	}

	private throwGenericRegistrationConflict(): never {
		throw new ConflictException(AUTH_RESPONSES.genericRegistration.message);
	}

	private assertUserCanAuthenticate(user: Pick<User, 'isActive' | 'isEmailVerified'>) {
		if (!user.isActive) {
			throw new ForbiddenException('Account is disabled.');
		}

		if (!user.isEmailVerified) {
			throw new ForbiddenException('Email is not verified.');
		}
	}

	private buildAuthResponse(
		user: Pick<
			User,
			'id' | 'email' | 'username' | 'displayUsername' | 'role' | 'isEmailVerified'
		>,
		accessToken: string,
		refreshToken: string
	): AuthResponse {
		return {
			accessToken,
			refreshToken,
			user: {
				id: user.id,
				email: user.email,
				username: user.username,
				displayUsername: user.displayUsername,
				role: user.role,
				isEmailVerified: user.isEmailVerified
			}
		};
	}

	private async resolveRefreshSession(refreshToken: string): Promise<AuthSession> {
		const payload = await this.verifyRefreshPayload(refreshToken);
		const currentSession = await this.sessionService.findActiveById(payload.sessionId);

		if (!currentSession || currentSession.userId !== payload.sub) {
			await this.sessionService.revokeFamily(payload.familyId);
			throw new UnauthorizedException('Refresh token is invalid or expired.');
		}

		const refreshTokenHash = this.tokenService.hashToken(refreshToken);

		if (currentSession.tokenHash !== refreshTokenHash) {
			await this.sessionService.revokeFamily(currentSession.familyId);
			throw new UnauthorizedException('Refresh token is invalid or expired.');
		}

		return currentSession;
	}

	private async verifyRefreshPayload(
		refreshToken: string
	): Promise<RefreshTokenPayload> {
		const payload = await this.tokenService.verifyRefreshToken(refreshToken);

		if (payload.type !== 'refresh') {
			throw new UnauthorizedException('Refresh token is invalid.');
		}

		return payload;
	}
}
