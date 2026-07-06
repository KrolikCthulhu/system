import { IsBoolean, IsInt, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class UpdateWeaponDto {
	@IsOptional()
	@IsString()
	name?: string;

	@IsOptional()
	@IsUUID()
	skillId?: string;

	@IsOptional()
	@IsInt()
	@Min(0)
	extraDamage?: number;

	@IsOptional()
	@IsBoolean()
	isActive?: boolean;

	@IsOptional()
	@IsInt()
	@Min(0)
	sortOrder?: number;
}
