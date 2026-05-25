export class FormChangeTracker<T> {
	private baselineSnapshot: string | null = null;

	constructor(
		private readonly serialize: (value: T) => string = value =>
			JSON.stringify(value)
	) {}

	capture(value: T) {
		this.baselineSnapshot = this.serialize(value);
	}

	clear() {
		this.baselineSnapshot = null;
	}

	hasChanges(value: T) {
		return (
			this.baselineSnapshot !== null &&
			this.serialize(value) !== this.baselineSnapshot
		);
	}
}
