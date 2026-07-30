import { Injectable, UnauthorizedException } from '@nestjs/common';
import { Socket } from 'socket.io';
import { UsersService } from '../users/users.service';
import { AuthenticatedUser } from './auth.types';
import { SessionService } from './session.service';
import { AuthenticatedSocket } from './socket-auth.types';
import { TokenService } from './token.service';

@Injectable()
export class SocketAuthService {
	constructor(
		private readonly tokenService: TokenService,
		private readonly sessionService: SessionService,
		private readonly usersService: UsersService
	) {}

	async authenticate(client: Socket): Promise<AuthenticatedUser> {
		const token = this.readAccessToken(client);

		if (!token) {
			throw new UnauthorizedException('Access token is required.');
		}

		const payload = await this.tokenService.verifyAccessToken(token);

		if (payload.type !== 'access') {
			throw new UnauthorizedException('Access token is invalid.');
		}

		const [session, user] = await Promise.all([
			this.sessionService.findActiveById(payload.sessionId),
			this.usersService.findById(payload.sub)
		]);

		if (!session || session.userId !== payload.sub || !user) {
			throw new UnauthorizedException('Access token session is invalid.');
		}

		if (!user.isActive) {
			throw new UnauthorizedException('Account is disabled.');
		}

		if (!user.isEmailVerified) {
			throw new UnauthorizedException('Email is not verified.');
		}

		const authenticatedUser: AuthenticatedUser = {
			id: user.id,
			email: user.email,
			username: user.username,
			displayUsername: user.displayUsername,
			role: user.role,
			sessionId: session.id
		};

		this.setUser(client, authenticatedUser);

		return authenticatedUser;
	}

	getUser(client: Socket): AuthenticatedUser | null {
		return (client as AuthenticatedSocket).data.user ?? null;
	}

	private setUser(client: Socket, user: AuthenticatedUser) {
		(client as AuthenticatedSocket).data.user = user;
	}

	private readAccessToken(client: Socket) {
		const token = client.handshake.auth?.['accessToken'];
		return typeof token === 'string' && token.trim() ? token.trim() : null;
	}
}
