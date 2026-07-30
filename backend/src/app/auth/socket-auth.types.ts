import { Socket } from 'socket.io';
import { AuthenticatedUser } from './auth.types';

export interface SocketAuthData {
	user?: AuthenticatedUser;
}

export type AuthenticatedSocket = Socket & {
	data: SocketAuthData;
};
