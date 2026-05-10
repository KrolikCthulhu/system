import { Transform } from 'class-transformer';
import { IsEmail } from 'class-validator';

export class ResendVerificationDto {
	@Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
	@IsEmail()
	email!: string;
}
