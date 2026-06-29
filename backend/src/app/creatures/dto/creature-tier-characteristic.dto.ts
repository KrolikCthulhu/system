import { IsInt, IsUUID, Min } from 'class-validator';

export class CreatureTierCharacteristicDto {
	@IsUUID()
	characteristicId!: string;

	@IsInt()
	@Min(0)
	value!: number;
}
