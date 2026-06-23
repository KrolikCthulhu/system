import { PrismaPg } from '@prisma/adapter-pg';
import * as dotenv from 'dotenv';
import * as dotenvExpand from 'dotenv-expand';
import { PrismaClient } from './__generated__/index.js';
import { seedDatabase } from './seed/seed-database';

dotenvExpand.expand(dotenv.config());

async function main() {
	const connectionString = process.env.POSTGRES_URI;

	if (!connectionString) {
		throw new Error('POSTGRES_URI is not set.');
	}

	const adapter = new PrismaPg({ connectionString });
	const prisma = new PrismaClient({ adapter });

	try {
		await prisma.$transaction(async tx => {
			await seedDatabase(tx);
		});
	} finally {
		await prisma.$disconnect();
	}
}

void main().catch(error => {
	console.error(error);
	process.exitCode = 1;
});
