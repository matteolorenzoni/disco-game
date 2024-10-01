import { Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { FirebaseService } from './service/firebase.service';
import { LogService } from './service/log.service';
import { FvToastComponent } from './components/fv-toast.component';
import { MenuItem } from './model/type';
import { faCalendarDays, faGears } from '@fortawesome/free-solid-svg-icons';
import { FvBottomNavigationComponent } from './components/fv-bottom-navigation.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, FvBottomNavigationComponent, FvToastComponent],
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

  /* Constants */
  MENU_USER: MenuItem[] = [
    {
      id: 0,
      label: 'Eventi',
      icon: faCalendarDays,
      path: 'user/events'
    },
    {
      id: 0,
      label: 'Impostazioni',
      icon: faGears,
      path: 'user/settings'
    }
  ];

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
