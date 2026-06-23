import * as argon2 from 'argon2';
import { Prisma, UserRole } from '../__generated__/index.js';

export const E2E_ADMIN_USER = {
	email: 'admin@system.local',
	username: 'admin',
	displayUsername: 'Admin',
	password: 'Admin12345!'
} as const;

export async function seedE2eUsers(tx: Prisma.TransactionClient) {
	const passwordHash = await argon2.hash(E2E_ADMIN_USER.password, {
		type: argon2.argon2id
	});

	await tx.user.upsert({
		where: { email: E2E_ADMIN_USER.email },
		create: {
			email: E2E_ADMIN_USER.email,
			username: E2E_ADMIN_USER.username,
			displayUsername: E2E_ADMIN_USER.displayUsername,
			passwordHash,
			role: UserRole.ADMIN,
			isActive: true,
			isEmailVerified: true
		},
		update: {
			username: E2E_ADMIN_USER.username,
			displayUsername: E2E_ADMIN_USER.displayUsername,
			passwordHash,
			role: UserRole.ADMIN,
			isActive: true,
			isEmailVerified: true
		}
	});
}
