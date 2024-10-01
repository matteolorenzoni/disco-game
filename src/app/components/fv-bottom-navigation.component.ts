import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { MenuItem } from '../model/type';
import { RouterLinkActive, RouterModule } from '@angular/router';

@Component({
  selector: 'fv-bottom-navigation',
  standalone: true,
  imports: [CommonModule, RouterModule, RouterLinkActive, FaIconComponent],
  template: `
    <nav class="fixed bottom-0 left-0 w-full bg-background p-2">
      <ul class="flex gap-2 rounded-lg bg-surface p-2 text-gray-400">
        @for (item of menu(); track item.id) {
          <li class="grow">
            <a [routerLink]="item.path" routerLinkActive="text-white" class="flex flex-col items-center gap-1">
              <fa-icon class="text-sm" [icon]="item.icon"></fa-icon>
              <span class="text-xxs">{{ item.label }}</span>
            </a>
          </li>
        }
      </ul>
    </nav>
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
export class FvBottomNavigationComponent {
  /* Input */
  menu = input.required<MenuItem[]>();
}
