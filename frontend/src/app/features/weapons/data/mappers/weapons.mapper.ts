import { Weapon, WeaponsCatalog } from '../../domain/weapons.models';
import {
	WeaponDto,
	WeaponSkillOptionDto,
	WeaponsCatalogResponseDto
} from '../dto/weapons.dto';

export function mapWeaponsCatalogResponseDto(
	dto: WeaponsCatalogResponseDto
): WeaponsCatalog {
	return {
		weapons: dto.weapons.map(mapWeaponDto),
		skills: dto.skills.map(mapWeaponSkillOptionDto)
	};
}

export function mapWeaponDto(dto: WeaponDto): Weapon {
	return {
		id: dto.id,
		slug: dto.slug,
		name: dto.name,
		skillId: dto.skillId,
		skill: mapWeaponSkillOptionDto(dto.skill),
		extraDamage: dto.extraDamage,
		isActive: dto.isActive,
		sortOrder: dto.sortOrder,
		createdAt: dto.createdAt,
		updatedAt: dto.updatedAt
	};
}

function mapWeaponSkillOptionDto(dto: WeaponSkillOptionDto) {
	return {
		id: dto.id,
		slug: dto.slug,
		name: dto.name,
		categoryId: dto.categoryId,
		category: dto.category,
		isActive: dto.isActive,
		sortOrder: dto.sortOrder,
		searchText: `${dto.name} ${dto.category.name}`
	};
}
