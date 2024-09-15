import { ToastComponent } from './components/toast/toast.component';
import { LogService } from './service/log.service';
import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { FirebaseService } from './service/firebase.service';
import { AuthService } from './service/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ToastComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  /* Services */
  readonly firebaseService = inject(FirebaseService);
  readonly authService = inject(AuthService);
  readonly logService = inject(LogService);

  constructor() {
    this.authService.observeUserState();
  }
}
