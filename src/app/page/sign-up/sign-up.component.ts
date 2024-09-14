import { CommonModule, formatDate } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../service/auth.service';
import { FirebaseUserService } from '../../service/firebase-user.service';
import { TypeCheckerService } from '../../service/type-checker.service';
import { FromMap, SignUpModel } from '../../model/form.model';
import { Router } from '@angular/router';

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
  readonly router = inject(Router);
  readonly authService = inject(AuthService);
  readonly firebaseUserService = inject(FirebaseUserService);
  readonly typeCheckerService = inject(TypeCheckerService);

  /* Form */
  signUpForm = new FormGroup<FromMap<SignUpModel>>({
    name: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    lastname: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    username: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(6)]
    }),
    birthDate: new FormControl(formatDate(new Date(), 'yyyy-MM-dd', 'it'), {
      nonNullable: true,
      validators: [Validators.required]
    }),
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
    /* Creazione utente */
    const userCredential = await this.authService.signUp(this.signUpForm.getRawValue());

    /* Aggiunta utente a DB */
    await this.firebaseUserService.addUser(userCredential.user.uid, {
      ...this.signUpForm.getRawValue()
    });
    await this.router.navigate(['./login']);
  }
}
