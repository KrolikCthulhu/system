import { Inject, Injectable } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { authConfig } from '../config/auth.config';
import { AccessTokenPayload, AuthenticatedUser } from '../auth.types';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
	constructor(
		@Inject(authConfig.KEY)
		private readonly authSettings: ConfigType<typeof authConfig>
	) {
		super({
			jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
			ignoreExpiration: false,
			secretOrKey: authSettings.accessTokenSecret
		});
	}

	validate(payload: AccessTokenPayload): AuthenticatedUser {
		return {
			id: payload.sub,
			email: payload.email,
			username: payload.username,
			displayUsername: payload.displayUsername,
			role: payload.role,
			sessionId: payload.sessionId
		};
	}
}
