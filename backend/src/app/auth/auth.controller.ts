import {
	Body,
	Controller,
	Get,
	HttpCode,
	HttpStatus,
	Post,
	Req,
	Res,
	UseGuards
} from '@nestjs/common';
import { Throttle, minutes } from '@nestjs/throttler';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { AuthenticatedUser } from './auth.types';
import { CurrentUser } from './decorators/current-user.decorator';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ResendVerificationDto } from './dto/resend-verification.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { TokenService } from './token.service';

@Controller('auth')
export class AuthController {
	constructor(
		private readonly authService: AuthService,
		private readonly tokenService: TokenService
	) {}

	@Post('register')
	@HttpCode(HttpStatus.CREATED)
	@Throttle({ default: { limit: 5, ttl: minutes(10) } })
	register(@Body() dto: RegisterDto) {
		return this.authService.register(dto);
	}

	@Post('verify-email')
	@HttpCode(HttpStatus.OK)
	@Throttle({ default: { limit: 10, ttl: minutes(10) } })
	verifyEmail(@Body() dto: VerifyEmailDto) {
		return this.authService.verifyEmail(dto);
	}

	@Post('resend-verification')
	@HttpCode(HttpStatus.OK)
	@Throttle({ default: { limit: 5, ttl: minutes(10) } })
	resendVerification(@Body() dto: ResendVerificationDto) {
		return this.authService.resendVerification(dto);
	}

	@Post('login')
	@HttpCode(HttpStatus.OK)
	@Throttle({ default: { limit: 5, ttl: minutes(10) } })
	async login(
		@Body() dto: LoginDto,
		@Req() request: Request,
		@Res({ passthrough: true }) response: Response
	) {
		const result = await this.authService.login(dto, {
			ipAddress: request.ip,
			userAgent: request.get('user-agent') ?? undefined
		});

		response.cookie(
			this.tokenService.getRefreshTokenCookieName(),
			result.refreshToken,
			this.tokenService.getRefreshTokenCookieOptions()
		);

		return {
			accessToken: result.accessToken,
			user: result.user
		};
	}

	@Post('refresh')
	@HttpCode(HttpStatus.OK)
	@Throttle({ default: { limit: 20, ttl: minutes(10) } })
	refresh(
		@Req() request: Request,
		@Res({ passthrough: true }) response: Response
	) {
		const refreshToken = this.tokenService.getRefreshTokenFromCookies(
			request.cookies as Record<string, string | undefined>
		);

		return this.authService
			.refresh(refreshToken, {
				ipAddress: request.ip,
				userAgent: request.get('user-agent') ?? undefined
			})
			.then((result) => {
				response.cookie(
					this.tokenService.getRefreshTokenCookieName(),
					result.refreshToken,
					this.tokenService.getRefreshTokenCookieOptions()
				);

				return {
					accessToken: result.accessToken,
					user: result.user
				};
			});
	}

	@Post('logout')
	@UseGuards(JwtAuthGuard)
	@HttpCode(HttpStatus.NO_CONTENT)
	async logout(
		@CurrentUser() user: AuthenticatedUser,
		@Req() request: Request,
		@Res({ passthrough: true }) response: Response
	) {
		const refreshToken = this.tokenService.getRefreshTokenFromCookies(
			request.cookies as Record<string, string | undefined>
		);

		await this.authService.logout(user, refreshToken);
		response.clearCookie(
			this.tokenService.getRefreshTokenCookieName(),
			this.tokenService.getClearedRefreshTokenCookieOptions()
		);
	}

	@Post('logout-all')
	@UseGuards(JwtAuthGuard)
	@HttpCode(HttpStatus.NO_CONTENT)
	async logoutAll(
		@CurrentUser() user: AuthenticatedUser,
		@Res({ passthrough: true }) response: Response
	) {
		await this.authService.logoutAll(user);
		response.clearCookie(
			this.tokenService.getRefreshTokenCookieName(),
			this.tokenService.getClearedRefreshTokenCookieOptions()
		);
	}

	@Get('me')
	@UseGuards(JwtAuthGuard)
	me(@CurrentUser() user: AuthenticatedUser) {
		return user;
	}
}
