import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
	getData(): { message: string } {
		return { message: 'Hello API' };
	}

	getHealth(): { status: 'ok' } {
		return { status: 'ok' };
	}
}
