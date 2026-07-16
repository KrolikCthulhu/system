import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import { Weapon, WeaponTemplate, WeaponsCatalog } from '../domain/weapons.models';
import {
	CreateWeaponTemplateDto,
	SaveWeaponAttackProfileDto,
	UpdateWeaponTemplateDto
} from './dto/weapons.dto';

export interface WeaponsRepository {
	loadCatalog(): Observable<WeaponsCatalog>;
	createWeapon(command: {
		name: string;
		templateId: string;
		skillId?: string;
		extraDamage?: number;
		attackProfiles?: SaveWeaponAttackProfileDto[];
		isActive?: boolean;
		sortOrder?: number;
	}): Observable<Weapon>;
	updateWeapon(
		id: string,
		command: {
			name?: string;
			templateId?: string;
			skillId?: string;
			extraDamage?: number;
			attackProfiles?: SaveWeaponAttackProfileDto[];
			isActive?: boolean;
			sortOrder?: number;
		}
	): Observable<Weapon>;
	deleteWeapon(id: string): Observable<void>;
	createWeaponTemplate(command: CreateWeaponTemplateDto): Observable<WeaponTemplate>;
	updateWeaponTemplate(
		id: string,
		command: UpdateWeaponTemplateDto
	): Observable<WeaponTemplate>;
	deleteWeaponTemplate(id: string): Observable<void>;
}

export const WEAPONS_REPOSITORY =
	new InjectionToken<WeaponsRepository>('WEAPONS_REPOSITORY');
