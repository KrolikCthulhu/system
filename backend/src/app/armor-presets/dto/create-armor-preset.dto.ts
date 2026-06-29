import { IsBoolean, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreateArmorPresetDto {
	@IsString()
	name!: string;

	@IsInt()
	@Min(0)
	points!: number;

	@IsInt()
	@Min(0)
	protection!: number;

	@IsOptional()
	@IsBoolean()
	isActive?: boolean;

	@IsOptional()
	@IsInt()
	@Min(0)
	sortOrder?: number;
}
