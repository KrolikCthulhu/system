import { IsBoolean, IsInt, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class CreateWeaponDto {
	@IsString()
	name!: string;

	@IsUUID()
	skillId!: string;

	@IsInt()
	@Min(0)
	extraDamage!: number;

	@IsOptional()
	@IsBoolean()
	isActive?: boolean;

	@IsOptional()
	@IsInt()
	@Min(0)
	sortOrder?: number;
}
