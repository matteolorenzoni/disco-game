import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faAngleRight, faCircleUser, faHome, faRightFromBracket } from '@fortawesome/free-solid-svg-icons';
import { FirebaseService } from '../../service/firebase.service';
import { UserCreateComponent } from '../user/user-create/user-create.component';
import { FvButtonComponent } from '../../components/fv-button.component';
import { FvButtonOutlinedComponent } from '../../components/fv-button-outlined.component';
import { TitleComponent } from '../../components/title/title.component';
import { HttpService } from '../../service/http.service';
import { UserService } from '../../service/user.service';
import { LogService } from '../../service/log.service';

export type Tab = {
  id: 'profile' | 'notifications';
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
export class SettingsComponent {
  /* Service */
  readonly router = inject(Router);
  readonly firebaseService = inject(FirebaseService);
  readonly httpService = inject(HttpService);
  readonly userService = inject(UserService);
  readonly logService = inject(LogService);

  /* Constants */
  TABS: Tab[] = [
    { id: 'profile', label: 'Profilo' }
    // { id: 'notifications', label: 'Notification' }
  ];

  /* Variables */
  activeTab = signal<Tab>(this.TABS[0]);

  /* Icon */
  ICON_HOME = faHome;
  ICON_RIGHT = faAngleRight;
  ICON_USER = faCircleUser;
  ICON_LOGOUT = faRightFromBracket;

  /* --------------- Methods --------------- */
  protected async logout(): Promise<void> {
    await this.httpService.execute(async () => {
      await this.firebaseService.logout();
      this.userService.user.set(undefined);
      this.router.navigate(['/login']);
      this.logService.addLogConfirm('Logout completato. Buona giornata!');
    });
  }
}
