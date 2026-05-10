import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { authConfig } from './config/auth.config';

@Injectable()
export class AuthCleanupService {
	private readonly logger = new Logger(AuthCleanupService.name);

	constructor(
		private readonly prisma: PrismaService,
		@Inject(authConfig.KEY)
		private readonly authSettings: ConfigType<typeof authConfig>
	) {}

	@Cron(CronExpression.EVERY_HOUR)
	async cleanupExpiredAuthData() {
		const cutoff = new Date(Date.now() - this.authSettings.authCleanupRetentionMs);

		const [deletedSessions, deletedVerificationTokens] = await this.prisma.$transaction([
			this.prisma.authSession.deleteMany({
				where: {
					OR: [
						{
							revokedAt: {
								lte: cutoff
							}
						},
						{
							expiresAt: {
								lte: cutoff
							}
						}
					]
				}
			}),
			this.prisma.emailVerificationToken.deleteMany({
				where: {
					OR: [
						{
							usedAt: {
								lte: cutoff
							}
						},
						{
							expiresAt: {
								lte: cutoff
							}
						}
					]
				}
			})
		]);

		if (deletedSessions.count > 0 || deletedVerificationTokens.count > 0) {
			this.logger.log(
				`Auth cleanup removed ${deletedSessions.count} session(s) and ${deletedVerificationTokens.count} verification token(s).`
			);
		}
	}
}
