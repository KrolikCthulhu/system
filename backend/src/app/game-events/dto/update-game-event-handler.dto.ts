import { IsBoolean, IsInt, IsObject, IsOptional, IsString, Min } from 'class-validator';

export class UpdateGameEventHandlerDto {
	@IsString()
	@IsOptional()
	name?: string;

	@IsString()
	@IsOptional()
	description?: string;

	@IsObject()
	@IsOptional()
	graph?: Record<string, unknown> | null;

	@IsBoolean()
	@IsOptional()
	isActive?: boolean;

	@IsInt()
	@Min(0)
	@IsOptional()
	sortOrder?: number;
}
