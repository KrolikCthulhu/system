import { Transform } from 'class-transformer';
import {
	IsEmail,
	IsString,
	Length,
	Matches,
	MinLength
} from 'class-validator';

export class RegisterDto {
	@Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
	@IsEmail()
	email!: string;

	@Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
	@IsString()
	@Length(3, 32)
	@Matches(/^[a-zA-Z0-9_]+$/)
	username!: string;

	@IsString()
	@MinLength(8)
	password!: string;
}
