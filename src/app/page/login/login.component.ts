import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, HostListener, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { faLock, faUser } from '@fortawesome/free-solid-svg-icons';
import { FromMap, LoginModel } from '../../model/form.model';
import { UserRole } from '../../model/user.model';
import { FirebaseService } from '../../service/firebase.service';
import { LogService } from '../../service/log.service';
import { UserService } from '../../service/user.service';
import { loginFormAnimation } from '../../animation/animations';
import { FvFieldIconComponent } from '../../components/fv-field-icon.component';
import { FvButtonComponent } from '../../components/fv-button.component';
import { HttpService } from '../../service/http.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FvFieldIconComponent, FvButtonComponent],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  animations: [loginFormAnimation],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoginComponent {
  /* Services */
  readonly router = inject(Router);
  readonly firebaseService = inject(FirebaseService);
  readonly httpService = inject(HttpService);
  readonly userService = inject(UserService);
  readonly logService = inject(LogService);

  /* Variables */
  page = signal<'welcome' | 'login'>('welcome');
  rememberMe = signal<boolean>(true);

  /* Form */
  loginForm = new FormGroup<FromMap<LoginModel>>({
    email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
    password: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(6)] })
  });

  /* Icons */
  faUser = faUser;
  faLock = faLock;

  /* ----------------- Listeners ----------------- */
  @HostListener('click', ['$event'])
  onHostClick(event: Event): void {
    // Verifica se il click è avvenuto all'interno della sezione "container_form"
    const target = event.target as HTMLElement;
    if (target.closest('#container_form')) return; // Ignora il click
    event.stopPropagation();
    this.setPage('welcome');
  }

  /* ----------------- Methods: page ----------------- */
  protected onGoToRegistry(): void {
    this.router.navigate(['/sign-up']);
  }

  protected setPage(page: 'welcome' | 'login'): void {
    this.page.set(page);
  }

  protected onRememberMeChange(target: EventTarget | null) {
    if (!target) return;
    const checkbox = target as HTMLInputElement;
    this.rememberMe.set(checkbox.checked);
  }

  /* ------------- Methods: auth ------------- */
  public async login(): Promise<void> {
    if (this.loginForm.invalid) throw new Error('formNotValid', { cause: 'formNotValid' });

    await this.httpService.execute(async () => {
      const userCredentials = await this.firebaseService.logIn(this.loginForm.getRawValue(), this.rememberMe());
      const user = await this.userService.getUserById(userCredentials.user.uid);
      switch (user?.props.role) {
        case UserRole.ADMIN:
          await this.router.navigate(['/admin/dashboard']);
          break;
        case UserRole.USER:
          await this.router.navigate(['/user/dashboard']);
          break;
        default:
          throw new Error('noUserDocument', { cause: 'noUserDocument' });
      }
      this.logService.addLogConfirm(`Benvenuto ${user.props.userName}`);
    });
  }

  protected resetPassword(): void {
    console.log('RESET PASSWORD');
  }
}
