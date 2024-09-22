import { Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { FirebaseService } from './service/firebase.service';
import { LogService } from './service/log.service';
import { FvToastComponent } from './components/fv-toast.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, FvToastComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  /* Services */
  readonly firebaseService = inject(FirebaseService);
  readonly logService = inject(LogService);

  /* Variables */
  isPortrait = signal<boolean>(false);
  isMobile = signal<boolean>(false);

  /* ------------------- Constructor ------------------- */
  constructor() {
    this.firebaseService.observeUserState();

    // Controlla se è un dispositivo mobile e il suo orientamento
    this.isMobile.set(/Mobi|Android/i.test(navigator.userAgent));
    this.isPortrait.set(screen.orientation.type.startsWith('portrait'));
    screen.orientation.addEventListener('change', () => {
      this.isPortrait.set(screen.orientation.type.startsWith('portrait'));
    });
  }
}
