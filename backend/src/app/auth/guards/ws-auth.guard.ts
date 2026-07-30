import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { SocketAuthService } from '../socket-auth.service';

@Injectable()
export class WsAuthGuard implements CanActivate {
	constructor(private readonly socketAuth: SocketAuthService) {}

	canActivate(context: ExecutionContext) {
		const client = context.switchToWs().getClient<Socket>();

		if (!this.socketAuth.getUser(client)) {
			throw new WsException('Unauthorized.');
		}

		return true;
	}
}
