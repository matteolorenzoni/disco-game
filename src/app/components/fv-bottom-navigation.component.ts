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
    <nav class="fixed bottom-0 left-0 h-16 w-full border-t border-neutral-800 bg-surface p-2 text-neutral-500">
      <ul class="flex h-full items-center gap-2">
        @for (item of menu(); track item.id) {
          <li class="flex-1">
            <a
              class="flex flex-col items-center justify-between"
              [routerLink]="item.path"
              routerLinkActive="text-white">
              <fa-icon class="text-sm" [icon]="item.icon"></fa-icon>
              <span class="text-xxs">{{ item.label }}</span>
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
