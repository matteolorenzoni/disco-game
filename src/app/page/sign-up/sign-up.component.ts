import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { UserService } from '../../service/user.service';
import { FromMap, SignUpModel } from '../../model/form.model';
import { FirebaseService } from '../../service/firebase.service';

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
  readonly firebaseService = inject(FirebaseService);
  readonly userService = inject(UserService);

  /* Form */
  signUpForm = new FormGroup<FromMap<SignUpModel>>({
    name: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    lastname: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    username: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(6)]
    }),
    birthDate: new FormControl('', {
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
    this.firebaseService.logout(false);
  }

  /* ------------- Methods ------------- */
  protected async signUp() {
    /* Creazione utente */
    const userCredential = await this.firebaseService.signUp(this.signUpForm.getRawValue());

    /* Aggiunta utente a DB */
    await this.userService.addUser(userCredential.user.uid, {
      ...this.signUpForm.getRawValue()
    });
    await this.router.navigate(['/login']);
  }
}
