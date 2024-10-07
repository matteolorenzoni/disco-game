import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faCircleUser, faRightFromBracket } from '@fortawesome/free-solid-svg-icons';
import { RouterModule } from '@angular/router';
import { UserService } from '../../service/user.service';
import { FirebaseService } from '../../service/firebase.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, RouterModule, FaIconComponent],
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SettingsComponent {
  /* Service */
  readonly firebaseService = inject(FirebaseService);
  readonly userService = inject(UserService);

  /* Icon */
  ICON_USER = faCircleUser;
  ICON_LOGOUT = faRightFromBracket;
}
