import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faCircleUser, faRightFromBracket } from '@fortawesome/free-solid-svg-icons';
import { RouterModule } from '@angular/router';
import { Doc } from '../../../model/firebase';
import { User } from '../../../model/user.model';
import { UserService } from '../../../service/user.service';
import { FirebaseService } from '../../../service/firebase.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, RouterModule, FaIconComponent],
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SettingsComponent implements OnInit {
  /* Service */
  readonly firebaseService = inject(FirebaseService);
  readonly userService = inject(UserService);

  /* Variables */
  user = signal<Doc<User> | null | undefined>(undefined);

  /* Icon */
  ICON_USER = faCircleUser;
  ICON_LOGOUT = faRightFromBracket;

  /* ----------------- Methods ----------------- */
  async ngOnInit(): Promise<void> {
    const user = await this.userService.user();
    this.user.set(user);
  }
}
