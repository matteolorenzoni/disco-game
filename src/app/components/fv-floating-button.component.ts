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
    class="fixed bottom-20 right-4 h-12 w-12 rounded-full bg-primary-500 p-2 text-white"
    (click)="execute()()">
    <fa-icon [icon]="ICON_ADD"></fa-icon>
  </button>`,
  styles: [],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FvFloatingButtonComponent {
  /* Services */
  readonly router = inject(Router);

  /* Inputs */
  execute = input.required<() => void>();

  /* Icons */
  ICON_ADD = faPlus;
}
