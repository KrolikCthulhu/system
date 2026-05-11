export interface AuthUserDto {
	id: string;
	email: string;
	username: string;
	displayUsername: string;
	role: 'USER' | 'ADMIN';
	isEmailVerified?: boolean;
	sessionId?: string;
}

export interface AuthSessionDto {
	accessToken: string;
	user: AuthUserDto;
}

export interface ApiMessageDto {
	message: string;
}
