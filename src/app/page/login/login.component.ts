import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../service/auth.service';
import { UserType } from '../../model/user.model';
import { FirebaseUserService } from '../../service/firebase-user.service';
import { FromMap, LoginModel } from '../../model/form.model';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoginComponent implements OnInit {
  /* Services */
  readonly authService = inject(AuthService);
  readonly firebaseUserService = inject(FirebaseUserService);
  readonly router = inject(Router);

  /* Form */
  loginForm = new FormGroup<FromMap<LoginModel>>({
    email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
    password: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(6)] })
  });

  /* ------------- Methods ------------- */
  ngOnInit(): void {
    this.authService.logout(false);
  }

  /* ------------- Methods ------------- */
  public async login(): Promise<void> {
    if (this.loginForm.invalid) return;

    const userCredentials = await this.authService.logIn(this.loginForm.getRawValue());
    const user = await this.firebaseUserService.getUserById(userCredentials.user.uid);
    switch (user?.props.type) {
      case UserType.ADMIN:
        await this.router.navigate(['/admin/dashboard']);
        break;
      case UserType.USER:
        await this.router.navigate(['/user/dashboard']);
        break;
      default:
        throw new Error(
          'Registered user found but no associated document exists. Please contact support for assistance.'
        );
    }
  }

  protected resetPassword(): void {
    console.log('RESET PASSWORD');
  }
}
