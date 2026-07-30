import { Injectable } from '@nestjs/common';
import { CombatEncounterRuntimeEngine } from './combat-encounter-runtime.engine';

@Injectable()
export class CombatEncounterRuntimeService extends CombatEncounterRuntimeEngine {}
