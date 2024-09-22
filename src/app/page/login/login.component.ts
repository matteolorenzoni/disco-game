import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, HostListener, inject, OnInit, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { faLock, faUser } from '@fortawesome/free-solid-svg-icons';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { FromMap, LoginModel } from '../../model/form.model';
import { UserType } from '../../model/user.model';
import { FirebaseService } from '../../service/firebase.service';
import { LogService } from '../../service/log.service';
import { UserService } from '../../service/user.service';
import { loginFormAnimation } from '../../animation/animations';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FaIconComponent],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  animations: [loginFormAnimation],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoginComponent implements OnInit {
  /* Services */
  readonly router = inject(Router);
  readonly firebaseService = inject(FirebaseService);
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
    if (target.closest('section#container_form')) return; // Ignora il click
    this.setPage(event, 'welcome');
  }

  /* ------------- Lifecycle ------------- */
  ngOnInit(): void {
    this.firebaseService.logout(false);
  }

  /* ----------------- Methods: page ----------------- */
  protected setPage(event: Event, page: 'welcome' | 'login'): void {
    event.stopPropagation();
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

    // Operation
    const userCredentials = await this.firebaseService.logIn(this.loginForm.getRawValue(), this.rememberMe());
    const user = await this.userService.getUserById(userCredentials.user.uid);
    switch (user?.props.type) {
      case UserType.ADMIN:
        await this.router.navigate(['/admin/dashboard']);
        break;
      case UserType.USER:
        await this.router.navigate(['/user/dashboard']);
        break;
      default:
        throw new Error('noUserDocument', { cause: 'noUserDocument' });
    }

    // Log
    this.logService.addLogConfirm(`Benvenuto ${user.props.username}`);
  }

  protected resetPassword(): void {
    console.log('RESET PASSWORD');
  }
}
