import { Injectable } from '@nestjs/common';
import { AuthSession, Prisma } from '@prisma/generated';
import { PrismaService } from '../prisma/prisma.service';

interface CreateSessionInput {
	id?: string;
	userId: string;
	tokenHash: string;
	familyId: string;
	expiresAt: Date;
	parentId?: string;
	ipAddress?: string;
	userAgent?: string;
}

@Injectable()
export class SessionService {
	constructor(private readonly prisma: PrismaService) {}

	createSession(input: CreateSessionInput) {
		return this.prisma.authSession.create({
			data: {
				id: input.id,
				userId: input.userId,
				tokenHash: input.tokenHash,
				familyId: input.familyId,
				expiresAt: input.expiresAt,
				parentId: input.parentId,
				ipAddress: input.ipAddress,
				userAgent: input.userAgent
			}
		});
	}

	findById(id: string) {
		return this.prisma.authSession.findUnique({
			where: { id }
		});
	}

	findActiveById(id: string) {
		return this.prisma.authSession.findFirst({
			where: {
				id,
				revokedAt: null,
				expiresAt: {
					gt: new Date()
				}
			}
		});
	}

	revokeSession(id: string, replacedById?: string) {
		return this.prisma.authSession.update({
			where: { id },
			data: {
				revokedAt: new Date(),
				replacedById: replacedById ?? null
			}
		});
	}

	revokeFamily(familyId: string) {
		return this.prisma.authSession.updateMany({
			where: {
				familyId,
				revokedAt: null
			},
			data: {
				revokedAt: new Date()
			}
		});
	}

	revokeAllForUser(userId: string) {
		return this.prisma.authSession.updateMany({
			where: {
				userId,
				revokedAt: null
			},
			data: {
				revokedAt: new Date()
			}
		});
	}

	findUserSessions(userId: string) {
		return this.prisma.authSession.findMany({
			where: { userId },
			orderBy: {
				createdAt: 'desc'
			}
		});
	}

	createSessionTransaction(input: CreateSessionInput): Prisma.PrismaPromise<AuthSession> {
		return this.prisma.authSession.create({
			data: {
				id: input.id,
				userId: input.userId,
				tokenHash: input.tokenHash,
				familyId: input.familyId,
				expiresAt: input.expiresAt,
				parentId: input.parentId,
				ipAddress: input.ipAddress,
				userAgent: input.userAgent
			}
		});
	}

	async rotateSession(
		currentSessionId: string,
		nextSession: CreateSessionInput
	) {
		return this.prisma.$transaction(async (tx) => {
			const createdSession = await tx.authSession.create({
				data: {
					id: nextSession.id,
					userId: nextSession.userId,
					tokenHash: nextSession.tokenHash,
					familyId: nextSession.familyId,
					expiresAt: nextSession.expiresAt,
					parentId: nextSession.parentId,
					ipAddress: nextSession.ipAddress,
					userAgent: nextSession.userAgent
				}
			});

			await tx.authSession.update({
				where: { id: currentSessionId },
				data: {
					revokedAt: new Date(),
					replacedById: createdSession.id
				}
			});

			return createdSession;
		});
	}
}
