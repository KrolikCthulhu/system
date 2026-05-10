import { Inject, Injectable } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { EmailVerificationToken, Prisma } from '@prisma/generated';
import { PrismaService } from '../prisma/prisma.service';
import { authConfig } from './config/auth.config';
import { TokenService } from './token.service';

interface IssueEmailVerificationTokenInput {
	userId: string;
	email: string;
}

@Injectable()
export class EmailVerificationService {
	constructor(
		private readonly prisma: PrismaService,
		private readonly tokenService: TokenService,
		@Inject(authConfig.KEY)
		private readonly authSettings: ConfigType<typeof authConfig>
	) {}

	async issueToken(input: IssueEmailVerificationTokenInput) {
		const token = await this.tokenService.createEmailVerificationToken({
			userId: input.userId,
			email: input.email
		});
		const tokenHash = this.tokenService.hashToken(token);
		const now = new Date();
		const expiresAt = new Date(
			now.getTime() + this.authSettings.emailVerificationTokenTtlMs
		);

		await this.prisma.$transaction([
			this.prisma.emailVerificationToken.updateMany({
				where: {
					userId: input.userId,
					usedAt: null
				},
				data: {
					usedAt: now
				}
			}),
			this.prisma.emailVerificationToken.create({
				data: {
					userId: input.userId,
					tokenHash,
					expiresAt
				}
			})
		]);

		return {
			token,
			expiresAt,
			verificationUrl: this.tokenService.buildEmailVerificationUrl(token)
		};
	}

	findLatestActiveTokenByUserId(userId: string) {
		return this.prisma.emailVerificationToken.findFirst({
			where: {
				userId,
				usedAt: null,
				expiresAt: {
					gt: new Date()
				}
			},
			orderBy: {
				createdAt: 'desc'
			}
		});
	}

	shouldThrottleResend(token: Pick<EmailVerificationToken, 'createdAt'>) {
		const earliestAllowedTime =
			token.createdAt.getTime() + this.authSettings.emailVerificationResendCooldownMs;

		return earliestAllowedTime > Date.now();
	}

	markAsUsed(
		id: string,
		tx?: Prisma.TransactionClient
	): Prisma.PrismaPromise<EmailVerificationToken> {
		const client = tx ?? this.prisma;

		return client.emailVerificationToken.update({
			where: { id },
			data: {
				usedAt: new Date()
			}
		});
	}

	findActiveByTokenHash(tokenHash: string) {
		return this.prisma.emailVerificationToken.findFirst({
			where: {
				tokenHash,
				usedAt: null,
				expiresAt: {
					gt: new Date()
				}
			},
			include: {
				user: true
			}
		});
	}

	async consumeToken(id: string, userId: string) {
		const now = new Date();

		return this.prisma.$transaction(async (tx) => {
			await tx.emailVerificationToken.update({
				where: { id },
				data: {
					usedAt: now
				}
			});

			const user = await tx.user.update({
				where: { id: userId },
				data: {
					isEmailVerified: true
				}
			});

			return user;
		});
	}
}
