import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { UserType } from '../../model/user.model';
import { UserService } from '../../service/user.service';
import { FromMap, LoginModel } from '../../model/form.model';
import { LogService } from '../../service/log.service';
import { FirebaseService } from '../../service/firebase.service';

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
  readonly router = inject(Router);
  readonly firebaseService = inject(FirebaseService);
  readonly userService = inject(UserService);
  readonly logService = inject(LogService);

  /* Form */
  loginForm = new FormGroup<FromMap<LoginModel>>({
    email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
    password: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(6)] })
  });

  /* ------------- Methods ------------- */
  ngOnInit(): void {
    this.firebaseService.logout(false);
  }

  /* ------------- Methods ------------- */
  public async login(): Promise<void> {
    if (this.loginForm.invalid) return;

    // Operation
    const userCredentials = await this.firebaseService.logIn(this.loginForm.getRawValue());
    const user = await this.userService.getUserById(userCredentials.user.uid);
    switch (user?.props.type) {
      case UserType.ADMIN:
        await this.router.navigate(['/admin/dashboard']);
        break;
      case UserType.USER:
        await this.router.navigate(['/user/dashboard']);
        break;
      default:
        throw new Error(
          "L'utente registrato è stato trovato ma non esiste un documento associato. Contattare il supporto per assistenza."
        );
    }

    // Log
    this.logService.addLogConfirm(`Benvenuto ${user.props.username}`);
  }

  protected resetPassword(): void {
    console.log('RESET PASSWORD');
  }
}
