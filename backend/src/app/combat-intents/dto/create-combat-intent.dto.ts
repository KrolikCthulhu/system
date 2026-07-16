import { IsBoolean, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreateCombatIntentDto {
	@IsString()
	name!: string;

	@IsString()
	category!: string;

	@IsOptional()
	@IsBoolean()
	isActive?: boolean;

	@IsOptional()
	@IsInt()
	@Min(0)
	sortOrder?: number;
}
