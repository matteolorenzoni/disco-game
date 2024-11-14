import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { MenuItem } from '../page/home/home.component';
import { RouterLinkActive, RouterModule } from '@angular/router';

@Component({
  selector: 'fv-bottom-navigation',
  standalone: true,
  imports: [CommonModule, RouterModule, RouterLinkActive, FaIconComponent],
  template: `
    <nav
      class="fixed bottom-0 left-0 z-20 h-16 w-full border-t border-primary-800 bg-primary-500 p-2 text-secondary-700">
      <ul class="flex h-full items-center gap-1">
        @for (item of menu(); track item.id) {
          <li class="flex-1 basis-0 overflow-hidden">
            <a
              class="flex flex-col items-center justify-between"
              [routerLink]="item.path"
              routerLinkActive="text-white">
              <fa-icon class="text-sm" [icon]="item.icon"></fa-icon>
              <span class="w-full overflow-hidden truncate text-center text-xxs">{{ item.label }}</span>
            </a>
          </li>
        }
      </ul>
    </nav>
  `,
  styles: [],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FvBottomNavigationComponent {
  /* Input */
  menu = input.required<MenuItem[]>();
}
