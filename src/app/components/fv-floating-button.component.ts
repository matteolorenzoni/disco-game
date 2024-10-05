import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { Router } from '@angular/router';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faPlus } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'fv-floating-button',
  standalone: true,
  imports: [CommonModule, FaIconComponent],
  template: ` <button
    class="fixed bottom-20 right-4 h-12 w-12 rounded-full bg-primary p-2 text-on-primary transition duration-100 ease-in active:scale-95 active:bg-primary-dark"
    (click)="router.navigate([path()])">
    <fa-icon [icon]="ICON_ADD"></fa-icon>
  </button>`,
  styles: [
    `
      :host {
        display: block;
      }
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FvFloatingButtonComponent {
  /* Services */
  readonly router = inject(Router);

  /* Inputs */
  path = input.required<string>();

  /* Icons */
  ICON_ADD = faPlus;
}
