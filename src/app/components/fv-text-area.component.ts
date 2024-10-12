import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { ControlContainer, FormGroupDirective, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'fv-text-area',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="relative flex flex-col">
      <textarea
        [id]="name()"
        [formControlName]="name()"
        class="peer mt-6 min-h-20 w-full rounded border border-field-border bg-field-background px-3 py-2 text-xs text-field-color shadow-sm focus:border-2 focus:outline-none disabled:bg-neutral-700 disabled:text-neutral-600"
        [ngClass]="[
          'focus:border-' + twColor() + '-500',
          'focus:text-' + twColor() + '-200',
          'focus:caret-' + twColor() + '-500'
        ]">
      </textarea>
      <label
        [for]="name()"
        class="absolute left-0 top-0 block text-sm font-medium text-field-label-color peer-focus:font-semibold"
        [ngClass]="['peer-focus:text-' + twColor() + '-500']">
        {{ label() }}
      </label>
    </div>
  `,
  styles: [],
  viewProviders: [{ provide: ControlContainer, useExisting: FormGroupDirective }],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FvTextAeraComponent {
  /* Inputs */
  label = input.required<string>();
  name = input.required<string>();
  twColor = input<string>('primary');
}
