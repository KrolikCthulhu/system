import { IsBoolean, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class UpdateArmorPresetDto {
	@IsOptional()
	@IsString()
	name?: string;

	@IsOptional()
	@IsInt()
	@Min(0)
	points?: number;

	@IsOptional()
	@IsInt()
	@Min(0)
	protection?: number;

	@IsOptional()
	@IsBoolean()
	isActive?: boolean;

	@IsOptional()
	@IsInt()
	@Min(0)
	sortOrder?: number;
}
