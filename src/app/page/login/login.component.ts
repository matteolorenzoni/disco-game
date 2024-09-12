import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { FirebaseService } from '../../service/firebase.service';
import { AuthService } from '../../service/auth.service';
import { Router } from '@angular/router';
import { UserType } from '../../model/enum.model';

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
  readonly firebaseService = inject(FirebaseService);
  readonly authService = inject(AuthService);
  readonly router = inject(Router);

  /* Form */
  loginForm = new FormGroup({
    email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
    password: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(6)] })
  });

  /* ------------- Methods ------------- */
  ngOnInit(): void {
    this.authService.logout();
  }

  /* ------------- Methods ------------- */
  protected async login(): Promise<void> {
    const { email, password } = this.loginForm.getRawValue();
    const user = await this.authService.logIn(email, password);
    switch (user.props.type) {
      case UserType.ADMIN:
        this.router.navigate(['/admin/dashboard']);
        break;
      case UserType.USER:
        this.router.navigate(['/user/dashboard']);
        break;
      default:
        break;
    }
  }

  protected resetPassword(): void {
    console.log('RESET PASSWORD');
  }
}
