import {
	Component,
	computed,
	inject,
	input,
	output,
	signal
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Button } from 'primeng/button';
import { FloatLabel } from 'primeng/floatlabel';
import { InputText } from 'primeng/inputtext';
import { Message } from 'primeng/message';
import { Password } from 'primeng/password';
import { SignUpCommand } from '../../../state/auth.commands';

const USERNAME_PATTERN = /^[A-Za-z0-9_]+$/;

@Component({
	selector: 'app-sign-up-form',
	imports: [
		ReactiveFormsModule,
		Button,
		FloatLabel,
		InputText,
		Message,
		Password
	],
	templateUrl: './sign-up-form.component.html',
	styleUrl: './sign-up-form.component.scss'
})
export class SignUpFormComponent {
	readonly submitted = output<SignUpCommand>();
	readonly pending = input(false);
	private readonly formBuilder = inject(FormBuilder);

	protected readonly form = this.formBuilder.nonNullable.group({
		email: ['', [Validators.required, Validators.email]],
		username: [
			'',
			[
				Validators.required,
				Validators.minLength(3),
				Validators.maxLength(32),
				Validators.pattern(USERNAME_PATTERN)
			]
		],
		password: ['', [Validators.required, Validators.minLength(8)]]
	});

	protected readonly attempted = signal(false);
	protected readonly showErrors = computed(() => this.attempted());

	protected submit() {
		if (this.pending()) {
			return;
		}

		this.attempted.set(true);

		if (this.form.invalid) {
			this.form.markAllAsTouched();
			return;
		}

		const { email, username, password } = this.form.getRawValue();

		this.submitted.emit({
			email: email.trim().toLowerCase(),
			username: username.trim(),
			password
		});
	}

	protected hasError(controlName: 'email' | 'username' | 'password') {
		const control = this.form.controls[controlName];
		return this.showErrors() && control.invalid;
	}
}
