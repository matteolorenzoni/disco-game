import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../service/auth.service';
import { FirebaseUserService } from '../../service/firebase-user.service';
import { TypeCheckerService } from '../../service/type-checker.service';

@Component({
  selector: 'app-sign-up',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './sign-up.component.html',
  styleUrls: ['./sign-up.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SignUpComponent implements OnInit {
  /* Services */
  readonly authService = inject(AuthService);
  readonly firebaseUserService = inject(FirebaseUserService);
  readonly typeCheckerService = inject(TypeCheckerService);

  /* Form */
  signUpForm = new FormGroup({
    name: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    lastname: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    username: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(6)]
    }),
    birthDate: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email]
    }),
    password: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(6)]
    })
  });

  /* ------------- Methods ------------- */
  ngOnInit(): void {
    this.authService.logout();
  }

  /* ------------- Methods ------------- */
  protected async signUp() {
    const { name, lastname, username, birthDate, email, password } = this.signUpForm.getRawValue();
    if (!this.typeCheckerService.isValidDate(birthDate)) {
      throw new Error('Date not valid'); // TODO: toast
    }

    /* Creazione utente */
    const userCredential = await this.authService.signUp(email, password);

    /* Aggiunta utente a DB */
    const date = new Date(birthDate);
    date.setHours(0, 0, 0, 0);
    await this.firebaseUserService.addUser(userCredential.user.uid, name, lastname, username, date, email);
  }
}
