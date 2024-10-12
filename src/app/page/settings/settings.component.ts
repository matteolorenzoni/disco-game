import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faAngleRight, faCircleUser, faHome, faRightFromBracket } from '@fortawesome/free-solid-svg-icons';
import { FirebaseService } from '../../service/firebase.service';
import { UserCreateComponent } from '../user/user-create/user-create.component';
import { FvButtonComponent } from '../../components/fv-button.component';
import { FvButtonOutlinedComponent } from '../../components/fv-button-outlined.component';
import { TitleComponent } from '../../components/title/title.component';

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
  readonly firebaseService = inject(FirebaseService);

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
    await this.firebaseService.logout(true);
  }
}
