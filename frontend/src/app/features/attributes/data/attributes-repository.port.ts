import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import {
	Attribute,
	AttributesAdminCatalog,
	Characteristic
} from '../domain/attributes.models';
import {
	CreateAttributeCommand,
	CreateCharacteristicCommand,
	UpdateAttributeActiveCommand,
	UpdateAttributeCommand,
	UpdateCharacteristicActiveCommand,
	UpdateCharacteristicCommand
} from '../state/attributes.commands';

export interface AttributesRepository {
	loadAdminCatalog(): Observable<AttributesAdminCatalog>;
	createAttribute(command: CreateAttributeCommand): Observable<Attribute>;
	updateAttribute(command: UpdateAttributeCommand): Observable<Attribute>;
	updateAttributeActive(
		command: UpdateAttributeActiveCommand
	): Observable<Attribute>;
	deleteAttribute(id: string): Observable<void>;
	createCharacteristic(
		command: CreateCharacteristicCommand
	): Observable<Characteristic>;
	updateCharacteristic(
		command: UpdateCharacteristicCommand
	): Observable<Characteristic>;
	updateCharacteristicActive(
		command: UpdateCharacteristicActiveCommand
	): Observable<Characteristic>;
	deleteCharacteristic(id: string): Observable<void>;
}

export const ATTRIBUTES_REPOSITORY = new InjectionToken<AttributesRepository>(
	'ATTRIBUTES_REPOSITORY'
);
