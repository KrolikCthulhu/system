import { BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/generated';

export function rethrowPrismaError(
	error: unknown,
	fallbackMessage: string,
	options?: {
		uniqueMessage?: string;
	}
): never {
	if (
		error instanceof Prisma.PrismaClientKnownRequestError &&
		error.code === 'P2002'
	) {
		throw new BadRequestException(
			options?.uniqueMessage ?? 'Значение должно быть уникальным.'
		);
	}

	throw error instanceof Error
		? error
		: new BadRequestException(fallbackMessage);
}
