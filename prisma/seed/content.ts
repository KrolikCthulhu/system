import { createRequire } from 'module';
import { join } from 'path';

const CONTENT_ROOT = join(__dirname, '..', 'content');
const requireContent = createRequire(__filename);

export function readContent<T>(relativePath: string): T {
	const path = join(CONTENT_ROOT, relativePath);
	const contentModule = requireContent(path) as { default?: T };

	if (!contentModule.default) {
		throw new Error(`Content module must export default: ${relativePath}`);
	}

	return contentModule.default;
}
