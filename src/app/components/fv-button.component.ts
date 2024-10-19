import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';

type ButtonType = 'button' | 'submit';

@Component({
  selector: 'fv-button',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button
      class="w-full rounded p-2 text-xs text-white shadow disabled:bg-neutral-300 disabled:text-neutral-400"
      [ngClass]="['bg-' + twColor() + '-500', 'hover:bg-' + twColor() + '-600', 'active:bg-' + twColor() + '-700']"
      [disabled]="disabled()"
      (click)="click($event)">
      {{ label() }}
    </button>
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
export class FvButtonComponent {
  /* Inputs */
  type = input<ButtonType>('button');
  label = input.required<string>();
  twColor = input<string>('primary');
  disabled = input<boolean>(false);
  onClick = input<() => void>();

  /* ------------------ Methods ------------------ */
  protected click(event: MouseEvent): void {
    const onClick = this.onClick();
    if (this.type() === 'button' && onClick) {
      event.stopPropagation();
      onClick();
    }
  }
}
