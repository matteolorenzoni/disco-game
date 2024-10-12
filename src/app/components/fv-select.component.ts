import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { ControlContainer, FormGroupDirective, ReactiveFormsModule } from '@angular/forms';

export type SelectOption<T> = {
  label: string;
  value: T;
};

@Component({
  selector: 'fv-select',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="relative flex flex-col">
      <select
        [id]="name()"
        [formControlName]="name()"
        class="peer mt-6 w-full rounded border border-field-border bg-field-background px-3 py-2 text-xs text-field-color shadow-sm focus:border-2 focus:outline-none disabled:bg-neutral-700 disabled:text-neutral-600"
        [ngClass]="[
          'focus:border-' + twColor() + '-500',
          'focus:text-' + twColor() + '-200',
          'focus:caret-' + twColor() + '-500'
        ]">
        @for (option of options(); track option.value) {
          <option [value]="option.value">{{ option.label }}</option>
        }
      </select>
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
export class FvSelectComponent<T> {
  /* Inputs */
  label = input.required<string>();
  name = input.required<string>();
  options = input.required<SelectOption<T>[]>();
  twColor = input<string>('primary');
}
