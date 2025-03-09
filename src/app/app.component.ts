import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { FvToastComponent } from './components/fv-toast.component';
import { FirebaseService } from './service/firebase.service';
import { IndexedDbService } from './service/indexed-db.service';
import { LoaderService } from './service/loader.service';
import { LogService } from './service/log.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, FvToastComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit, OnDestroy {
  /* Services */
  private readonly firebaseService = inject(FirebaseService);
  protected readonly loaderService = inject(LoaderService);
  protected readonly dbService = inject(IndexedDbService);
  protected readonly logService = inject(LogService);

  /* Variables */
  protected isMobile = signal<boolean>(false);
  protected isPortrait = signal<boolean>(false);

  /* Constants */
  private mediaQueryList = window.matchMedia('(orientation: portrait)');

  /* ------------------- Lifecycle hooks ------------------- */
  ngOnInit() {
    // Recupero le informazioni dell'utente
    this.firebaseService.observeUserState();

    // Controlla se è un dispositivo mobile e il suo orientamento
    this.isMobile.set(this.checkIsMobile());

    // Controlla l'orientamento del dispositivo (portrait/landscape)
    if (this.mediaQueryList?.matches !== undefined) {
      this.isPortrait.set(this.mediaQueryList.matches);
    } else {
      this.isPortrait.set(window.innerHeight > window.innerWidth);
    }

    // Event listener per cambiamenti di orientamento
    if (typeof this.mediaQueryList.addEventListener === 'function') {
      this.mediaQueryList.addEventListener('change', this.onOrientationChange);
    } else if (typeof this.mediaQueryList.addListener === 'function') {
      this.mediaQueryList.addListener(this.onOrientationChange);
    } else {
      window.addEventListener('resize', this.onResize);
    }
  }

  ngOnDestroy() {
    if (typeof this.mediaQueryList.removeEventListener === 'function') {
      this.mediaQueryList.removeEventListener('change', this.onOrientationChange);
    } else if (typeof this.mediaQueryList.removeListener === 'function') {
      this.mediaQueryList.removeListener(this.onOrientationChange);
    }
    window.removeEventListener('resize', this.onResize);
  }

  /* ------------------- Method: event ------------------- */
  private onOrientationChange = (event: MediaQueryListEvent) => {
    this.isPortrait.set(event.matches);
  };

  private onResize = () => {
    this.isPortrait.set(window.innerHeight > window.innerWidth);
  };

  protected async onRefreshPage(): Promise<void> {
    await this.dbService.clearAllStores();
    window.location.reload();
  }

  /* ------------------- Helper: checkIsMobile ------------------- */
  private checkIsMobile = (): boolean => {
    return /Mobi|Android/i.test(navigator.userAgent) || (window.innerWidth <= 768 && window.innerHeight <= 1024);
  };
}
