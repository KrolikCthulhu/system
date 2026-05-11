import { AuthSession, AuthUser } from '../../../domain/auth/auth.models';
import { AuthSessionDto, AuthUserDto } from '../dto/auth.dto';

export function mapAuthUserDto(dto: AuthUserDto): AuthUser {
	return {
		id: dto.id,
		email: dto.email,
		username: dto.username,
		displayUsername: dto.displayUsername,
		role: dto.role,
		isEmailVerified: dto.isEmailVerified,
		sessionId: dto.sessionId
	};
}

export function mapAuthSessionDto(dto: AuthSessionDto): AuthSession {
	return {
		accessToken: dto.accessToken,
		user: mapAuthUserDto(dto.user)
	};
}
