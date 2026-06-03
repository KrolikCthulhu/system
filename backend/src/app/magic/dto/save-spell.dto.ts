import {
	IsBoolean,
	IsEnum,
	IsInt,
	IsOptional,
	IsString,
	IsUUID,
	Min
} from 'class-validator';
import { SpellStatus } from '@prisma/generated';

export class SaveSpellDto {
	@IsOptional()
	@IsUUID('4')
	actionId?: string;

	@IsOptional()
	@IsUUID('4')
	essenceId?: string;

	@IsOptional()
	@IsUUID('4')
	gestureId?: string;

	@IsString()
	name!: string;

	@IsOptional()
	@IsString()
	description?: string;

	@IsEnum(SpellStatus)
	status!: SpellStatus;

	@IsOptional()
	@IsBoolean()
	isActive?: boolean;

	@IsOptional()
	@IsInt()
	@Min(0)
	sortOrder?: number;
}
