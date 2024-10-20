import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faAngleRight, faCircleUser, faHome, faRightFromBracket } from '@fortawesome/free-solid-svg-icons';
import { FirebaseService } from '../../service/firebase.service';
import { UserCreateComponent } from '../user/user-create/user-create.component';
import { FvButtonComponent } from '../../components/fv-button.component';
import { FvButtonOutlinedComponent } from '../../components/fv-button-outlined.component';
import { TitleComponent } from '../../components/title/title.component';
import { HttpService } from '../../service/http.service';
import { LogService } from '../../service/log.service';
import { Doc } from '../../model/firebase';
import { User } from '../../model/user.model';
import { LocalStorageService } from '../../service/local-storage.service';

export type Tab = {
  id: 'profile' | 'code' | 'notifications';
  label: string;
};

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FaIconComponent,
    TitleComponent,
    UserCreateComponent,
    FvButtonComponent,
    FvButtonOutlinedComponent
  ],
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SettingsComponent implements OnInit {
  /* Service */
  readonly router = inject(Router);
  readonly firebaseService = inject(FirebaseService);
  readonly httpService = inject(HttpService);
  readonly lsService = inject(LocalStorageService);
  readonly logService = inject(LogService);

  /* Constants */
  TABS: Tab[] = [
    { id: 'profile', label: 'Profilo' },
    { id: 'code', label: 'Codice' }
    // { id: 'notifications', label: 'Notification' }
  ];

  /* Variables */
  activeTab = signal<Tab>(this.TABS[0]);
  user = signal<Doc<User> | undefined>(undefined);

  /* Icon */
  ICON_HOME = faHome;
  ICON_RIGHT = faAngleRight;
  ICON_USER = faCircleUser;
  ICON_LOGOUT = faRightFromBracket;

  /* --------------------- Lifecycle hooks --------------------- */
  ngOnInit(): void {
    this.user.set(this.lsService.getUser() ?? undefined);
  }

  /* --------------------- Methods --------------------- */
  protected async logout(): Promise<void> {
    await this.httpService.execute(async () => {
      await this.firebaseService.logout();
      this.router.navigate(['/login']);
      this.logService.addLogConfirm('Logout completato. Buona giornata!');
    });
  }
}
