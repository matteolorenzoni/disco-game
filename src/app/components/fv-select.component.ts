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
        class="peer mt-5 h-8 w-full rounded border border-field-border bg-field-background text-xs text-field-color shadow-sm focus:border-2 focus:border-focus-field focus:font-semibold focus:text-primary-600 focus:caret-primary-600 focus:outline-none disabled:bg-primary-300 disabled:text-gray-200">
        @for (option of options(); track option.value) {
          <option [value]="option.value">{{ option.label }}</option>
        }
      </select>
      <label
        [for]="name()"
        class="absolute left-0 top-0 block text-sm font-medium text-primary-500 peer-focus:font-bold peer-focus:text-primary-600">
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
