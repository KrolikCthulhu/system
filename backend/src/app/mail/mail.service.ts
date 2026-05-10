import { Injectable, Logger } from '@nestjs/common';

interface SendEmailVerificationInput {
	email: string;
	verificationUrl: string;
}

@Injectable()
export class MailService {
	private readonly logger = new Logger(MailService.name);

	async sendEmailVerification(input: SendEmailVerificationInput) {
		this.logger.log(
			`Email verification requested for ${input.email}: ${input.verificationUrl}`
		);
	}
}
