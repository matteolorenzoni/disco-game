import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { faAngleRight, faCircleUser, faHome, faRightFromBracket } from '@fortawesome/free-solid-svg-icons';
import { TitleComponent } from '../../components/title/title.component';
import { Doc } from '../../model/firebase';
import { User } from '../../model/user.model';
import { FirebaseService } from '../../service/firebase.service';
import { LoaderService } from '../../service/loader.service';
import { LocalStorageService } from '../../service/local-storage.service';
import { LogService } from '../../service/log.service';
import { UserCreateComponent } from '../register/user-create/user-create.component';

export type Tab = {
  id: 'profile' | 'code' | 'app' | 'notifications';
  label: string;
};

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, RouterModule, TitleComponent, UserCreateComponent],
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SettingsComponent implements OnInit {
  /* Service */
  private readonly router = inject(Router);
  private readonly firebaseService = inject(FirebaseService);
  private readonly lsService = inject(LocalStorageService);
  private readonly logService = inject(LogService);
  private readonly loaderService = inject(LoaderService);

  /* Constants */
  TABS: Tab[] = [
    { id: 'profile', label: 'Profilo' },
    { id: 'code', label: 'Codice' }
    // { id: 'app', label: 'Applicazione' }
  ];

  /* Variables */
  activeTab = signal<Tab>(this.TABS[0]);
  user = signal<Doc<User> | undefined>(undefined);
  // deferredPrompt = signal<BeforeInstallPromptEvent | undefined>(undefined);
  // showInstallPrompt = signal<boolean>(false);

  /* Icon */
  ICON_HOME = faHome;
  ICON_RIGHT = faAngleRight;
  ICON_USER = faCircleUser;
  ICON_LOGOUT = faRightFromBracket;

  /* -------------------- Constructor -------------------- */
  // constructor() {
  //   window.addEventListener('beforeinstallprompt', this.handleBeforeInstallPrompt as EventListener);
  // }

  /* -------------------- Lifecycle hooks -------------------- */
  ngOnInit(): void {
    this.initIndexDB();
  }

  // ngOnDestroy(): void {
  //   window.removeEventListener('beforeinstallprompt', this.handleBeforeInstallPrompt as EventListener);
  // }

  /* -------------------------- Methods initialization --------------------------  */
  private async initIndexDB() {
    const user = this.lsService.getUser();
    this.user.set(user ?? undefined);
  }

  /* --------------------- Methods: profile --------------------- */
  protected async logout(): Promise<void> {
    await this.loaderService.executeImmediate(async () => {
      await this.firebaseService.logout();
      this.router.navigate(['/login']);
      this.logService.addLogConfirm('Logout completato. Buona giornata!');
    });
  }

  /* --------------------- Methods: app --------------------- */
  // protected installPWA() {
  //   const deferredPrompt = this.deferredPrompt();
  //   if (deferredPrompt) {
  //     deferredPrompt.prompt(); // Mostra il prompt di installazione
  //     deferredPrompt.userChoice.then((choiceResult) => {
  //       if (choiceResult.outcome === 'accepted') {
  //         console.log('Utente ha accettato l’installazione.');
  //       } else {
  //         console.log('Utente ha rifiutato l’installazione.');
  //       }
  //       this.deferredPrompt.set(undefined); // Resetta il prompt
  //     });
  //   }
  // }

  // private handleBeforeInstallPrompt(event: BeforeInstallPromptEvent) {
  //   event.preventDefault();
  //   this.deferredPrompt.set(event);
  //   this.showInstallPrompt.set(true); // Mostra il messaggio per l'utente
  // }
}
