import { Module } from '@nestjs/common';
import { ConfigModule, ConfigType } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { MailModule } from '../mail/mail.module';
import { PrismaModule } from '../prisma/prisma.module';
import { UsersModule } from '../users/users.module';
import { AuthCleanupService } from './auth-cleanup.service';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { authConfig } from './config/auth.config';
import { EmailVerificationService } from './email-verification.service';
import { WsAuthGuard } from './guards/ws-auth.guard';
import { PasswordService } from './password.service';
import { SessionService } from './session.service';
import { SocketAuthService } from './socket-auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { TokenService } from './token.service';

@Module({
	imports: [
		ConfigModule.forFeature(authConfig),
		PassportModule.register({
			defaultStrategy: 'jwt'
		}),
		JwtModule.registerAsync({
			imports: [ConfigModule.forFeature(authConfig)],
			inject: [authConfig.KEY],
			useFactory: (settings: ConfigType<typeof authConfig>) => ({
				secret: settings.accessTokenSecret
			})
		}),
		PrismaModule,
		UsersModule,
		MailModule
	],
	controllers: [AuthController],
	providers: [
		AuthCleanupService,
		AuthService,
		EmailVerificationService,
		PasswordService,
		SessionService,
		SocketAuthService,
		TokenService,
		WsAuthGuard,
		JwtStrategy
	],
	exports: [
		AuthService,
		PasswordService,
		SessionService,
		SocketAuthService,
		TokenService,
		WsAuthGuard
	]
})
export class AuthModule {}
