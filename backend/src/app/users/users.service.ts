import { Injectable } from '@nestjs/common';
import { Prisma, User } from '@prisma/generated';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
	constructor(private readonly prisma: PrismaService) {}

	findById(id: string) {
		return this.prisma.user.findUnique({
			where: { id }
		});
	}

	findByEmail(email: string) {
		return this.prisma.user.findUnique({
			where: { email }
		});
	}

	findByUsername(username: string) {
		return this.prisma.user.findUnique({
			where: { username }
		});
	}

	create(data: Prisma.UserCreateInput): Promise<User> {
		return this.prisma.user.create({
			data
		});
	}

	update(id: string, data: Prisma.UserUpdateInput) {
		return this.prisma.user.update({
			where: { id },
			data
		});
	}
}
