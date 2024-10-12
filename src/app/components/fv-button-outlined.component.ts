import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';

type ButtonType = 'button' | 'submit';

@Component({
  selector: 'fv-button-outlined',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button
      class="w-full rounded border-2 p-2 text-xs font-bold shadow disabled:bg-neutral-300 disabled:text-neutral-400"
      [ngClass]="[
        'border-' + twColor() + '-500',
        'hover:border-' + twColor() + '-600',
        'active:border-' + twColor() + '-700',
        'text-' + twColor() + '-500',
        'hover:text-' + twColor() + '-600',
        'active:text-' + twColor() + '-700'
      ]"
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
export class FvButtonOutlinedComponent {
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
