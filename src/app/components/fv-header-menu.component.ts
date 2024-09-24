import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, output } from '@angular/core';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faBars } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'fv-header-menu',
  standalone: true,
  imports: [CommonModule, FaIconComponent],
  template: ` <nav class="flex h-14 items-center justify-between overflow-hidden bg-primary p-3 text-on-primary">
    <div class="flex h-full items-center gap-8">
      <button (click)="closeMenuEvt.emit($event)"><fa-icon [icon]="ICON_MENU"></fa-icon></button>
      <a class="flex" href="/user/dashboard">
        <span class="self-center whitespace-nowrap text-xl font-semibold">Fanta volta</span>
      </a>
    </div>
  </nav>`,
  styles: [
    `
      :host {
        display: block;
      }
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FvHeaderMenuComponent {
  /* Outputs */
  closeMenuEvt = output<Event>();

  /* Icons */
  ICON_MENU = faBars;
}
