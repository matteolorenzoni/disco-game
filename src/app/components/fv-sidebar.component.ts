import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { RouterLink, RouterModule } from '@angular/router';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faGears, faRightFromBracket } from '@fortawesome/free-solid-svg-icons';
import { FirebaseService } from '../service/firebase.service';
import { UserService } from './../service/user.service';
import { SideMenuItem } from '../page/home/home.component';

@Component({
  selector: 'fv-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, FaIconComponent, RouterLink],
  template: `
    <div
      class="absolute -top-14 z-20 flex h-screen w-64 flex-col gap-6 bg-primary p-4 text-white shadow-lg transition-transform duration-300">
      <div class="flex items-center gap-4 rounded-lg bg-white/10 p-4 shadow-md">
        <img
          [src]="(userService.user() | async)?.imageUrl ?? '/images/profile-user.png'"
          alt="Immagine profilo"
          class="h-14 w-14 rounded-full border-2 border-primary-variant object-cover object-center" />
        <div class="flex flex-col gap-1">
          <p class="text-xl font-semibold">{{ (userService.user() | async)?.username }}</p>
          <div class="flex flex-col gap-1 text-xs leading-3 text-gray-300">
            <p>Serate: {{ 3 }}</p>
            <p>Sfide: {{ 12 }}</p>
          </div>
        </div>
      </div>

      <ul class="flex flex-col gap-2">
        @for (item of sideMenu(); track $index) {
          <li>
            <a
              [routerLink]="item.path"
              [routerLinkActive]="'bg-primary-variant'"
              [routerLinkActiveOptions]="{ exact: true }"
              class="flex items-center gap-2 rounded-md p-2 transition-colors duration-200 hover:bg-primary-variant"
              (click)="closeMenuEvt.emit($event)">
              <fa-icon class="h-6 w-6" [icon]="item.icon"></fa-icon>
              <span class="text-sm font-medium">{{ item.label }}</span>
            </a>
          </li>
        }
      </ul>

      <hr class="border-primary-variant/60" />

      <ul class="flex flex-col gap-2">
        <li>
          <a
            [routerLink]="'/settings'"
            [routerLinkActive]="'bg-primary-variant'"
            [routerLinkActiveOptions]="{ exact: true }"
            class="flex items-center gap-2 rounded-md p-2 transition-colors duration-200 hover:bg-primary-variant"
            (click)="closeMenuEvt.emit($event)">
            <fa-icon class="h-6 w-6" [icon]="ICON_SETTING"></fa-icon>
            <span class="text-sm font-medium">Impostazioni</span>
          </a>
        </li>
        <li>
          <a
            [routerLink]="'/login'"
            [routerLinkActive]="'bg-primary-variant'"
            [routerLinkActiveOptions]="{ exact: true }"
            class="flex items-center gap-2 rounded-md p-2 transition-colors duration-200 hover:bg-primary-variant"
            (click)="firebaseService.logout()">
            <fa-icon class="h-6 w-6" [icon]="ICON_LOGOUT"></fa-icon>
            <span class="text-sm font-medium">Logout</span>
          </a>
        </li>
      </ul>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FvSidebarComponent {
  /* Services */
  readonly firebaseService = inject(FirebaseService);
  readonly userService = inject(UserService);

  /* Input */
  sideMenu = input.required<SideMenuItem[]>();

  /* Outputs */
  closeMenuEvt = output<Event>();

  /* Icons */
  ICON_SETTING = faGears;
  ICON_LOGOUT = faRightFromBracket;
}
