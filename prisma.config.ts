import dotenv from 'dotenv';
import dotenvExpand from 'dotenv-expand';
import { defineConfig, env } from 'prisma/config';

dotenvExpand.expand(dotenv.config());

export default defineConfig({
	schema: 'prisma/schema.prisma',
	migrations: {
		path: 'prisma/migrations',
		seed: 'ts-node -P prisma/tsconfig.seed.json prisma/seed.ts'
	},
	datasource: {
		url: env('POSTGRES_URI')
	}
});
