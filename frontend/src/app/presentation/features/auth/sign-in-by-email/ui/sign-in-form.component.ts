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
import { SignInCommand } from '../../../../../use-cases/auth/commands/auth.commands';

@Component({
	selector: 'app-sign-in-form',
	imports: [
		ReactiveFormsModule,
		Button,
		FloatLabel,
		InputText,
		Message,
		Password
	],
	templateUrl: './sign-in-form.component.html',
	styleUrl: './sign-in-form.component.scss'
})
export class SignInFormComponent {
	readonly submitted = output<SignInCommand>();
	readonly pending = input(false);
	private readonly formBuilder = inject(FormBuilder);

	protected readonly form = this.formBuilder.nonNullable.group({
		email: ['', [Validators.required, Validators.email]],
		password: ['', [Validators.required]]
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

		const { email, password } = this.form.getRawValue();

		this.submitted.emit({
			email: email.trim().toLowerCase(),
			password
		});
	}

	protected hasError(controlName: 'email' | 'password') {
		const control = this.form.controls[controlName];
		return this.showErrors() && control.invalid;
	}
}
