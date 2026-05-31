import { Injectable, inject, signal } from '@angular/core';
import {
	VALUES_REPOSITORY,
	ValuesRepository
} from '../data/values-repository.port';
import { SystemValue } from '../domain/values.models';

@Injectable({ providedIn: 'root' })
export class SystemValuesCatalogFacade {
	private readonly repository = inject<ValuesRepository>(VALUES_REPOSITORY);
	private readonly initialized = signal(false);

	readonly loading = signal(false);
	readonly errorMessage = signal<string | null>(null);
	readonly values = signal<SystemValue[]>([]);

	ensureLoaded() {
		if (this.initialized() || this.loading()) {
			return;
		}

		this.reload();
	}

	reload() {
		this.loading.set(true);
		this.errorMessage.set(null);

		this.repository.loadCatalog().subscribe({
			next: catalog => {
				this.values.set(catalog.values);
				this.initialized.set(true);
				this.loading.set(false);
			},
			error: error => {
				this.errorMessage.set(
					error instanceof Error ? error.message : 'Не удалось загрузить значения.'
				);
				this.loading.set(false);
			}
		});
	}

	replaceValue(value: SystemValue) {
		this.values.update(current =>
			current.map(item => (item.id === value.id ? value : item))
		);
	}

	reloadIfInitialized() {
		if (!this.initialized()) {
			return;
		}

		this.reload();
	}
}
