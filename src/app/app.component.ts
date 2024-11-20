import { Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { FirebaseService } from './service/firebase.service';
import { LogService } from './service/log.service';
import { FvToastComponent } from './components/fv-toast.component';
import { LoaderService } from './service/loader.service';
import { IndexedDbService } from './service/indexed-db.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, FvToastComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  /* Services */
  private readonly firebaseService = inject(FirebaseService);
  protected readonly loaderService = inject(LoaderService);
  protected readonly dbService = inject(IndexedDbService);
  protected readonly logService = inject(LogService);

  /* Variables */
  isPortrait = signal<boolean>(false);
  isMobile = signal<boolean>(false);

  /* ------------------- Constructor ------------------- */
  constructor() {
    this.firebaseService.observeUserState();

    // Controlla se è un dispositivo mobile e il suo orientamento
    this.isMobile.set(this.checkIsMobile());
    this.isPortrait.set(this.getOrientation() === 'portrait');

    // Aggiungi un listener per i cambiamenti di orientamento
    if ('screen' in window && 'orientation' in window.screen) {
      window.screen.orientation.addEventListener('change', () => {
        this.isPortrait.set(this.getOrientation() === 'portrait');
      });
    } else {
      // Fallback: usa l'evento resize per browser che non supportano screen.orientation
      window.addEventListener('resize', () => {
        this.isPortrait.set(this.getOrientation() === 'portrait');
      });
    }
  }

  /* ------------------- Method: event ------------------- */
  protected async onRefreshPage(): Promise<void> {
    await this.dbService.clearAllStores();
    window.location.reload();
  }

  /* ------------------- Helper: getOrientation ------------------- */
  private getOrientation(): string {
    if ('screen' in window && 'orientation' in window.screen && window.screen.orientation?.type) {
      // Browser moderni con screen.orientation
      return window.screen.orientation.type.startsWith('portrait') ? 'portrait' : 'landscape';
    } else if (typeof window.orientation !== 'undefined') {
      // Fallback per vecchi browser con window.orientation
      return window.orientation === 0 || window.orientation === 180 ? 'portrait' : 'landscape';
    } else {
      // Fallback universale basato su innerWidth e innerHeight
      return window.innerHeight > window.innerWidth ? 'portrait' : 'landscape';
    }
  }

  /* ------------------- Helper: checkIsMobile ------------------- */
  private checkIsMobile(): boolean {
    return /Mobi|Android/i.test(navigator.userAgent) || (window.innerWidth <= 768 && window.innerHeight <= 1024);
  }
}
