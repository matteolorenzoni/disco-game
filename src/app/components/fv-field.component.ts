import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { ControlContainer, FormGroupDirective, ReactiveFormsModule } from '@angular/forms';

type InputType = 'text' | 'password' | 'email' | 'number' | 'date' | 'datetime-local';

@Component({
  selector: 'fv-field',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="relative flex flex-col overflow-hidden">
      @switch (type()) {
        @case ('number') {
          <input
            [id]="name()"
            type="number"
            [attr.inputmode]="'numeric'"
            [formControlName]="name()"
            [min]="min()"
            [max]="max()"
            [step]="step()"
            autocomplete="off"
            class="peer mt-5 h-8 w-full rounded border border-field-border bg-field-background px-3 py-2 text-xs text-field-color shadow focus:border-2 focus:border-focus-field focus:font-semibold focus:text-focus-field focus:caret-focus-field focus:outline-none disabled:bg-primary-300 disabled:text-gray-200" />
        }

        @case ('date') {
          <input
            [id]="name()"
            [type]="type()"
            [formControlName]="name()"
            autocomplete="off"
            class="peer mt-5 h-8 w-full rounded border border-field-border bg-field-background px-3 py-2 text-xs text-field-color shadow focus:border-2 focus:border-focus-field focus:font-semibold focus:text-focus-field focus:caret-focus-field focus:outline-none disabled:bg-primary-300 disabled:text-gray-200" />
        }

        @case ('datetime-local') {
          <input
            [id]="name()"
            [type]="type()"
            [formControlName]="name()"
            autocomplete="off"
            class="peer mt-5 h-8 w-full rounded border border-field-border bg-field-background px-3 py-2 text-xs text-field-color shadow focus:border-2 focus:border-focus-field focus:font-semibold focus:text-focus-field focus:caret-focus-field focus:outline-none disabled:bg-primary-300 disabled:text-gray-200" />
        }

        @default {
          <input
            [id]="name()"
            [type]="type()"
            [formControlName]="name()"
            autocomplete="off"
            class="peer mt-5 h-8 w-full rounded border border-field-border bg-field-background px-3 py-2 text-xs text-field-color shadow focus:border-2 focus:border-focus-field focus:font-semibold focus:text-focus-field focus:caret-focus-field focus:outline-none disabled:bg-primary-300 disabled:text-gray-200" />
        }
      }
      <label
        [for]="name()"
        class="absolute left-0 top-0 block w-full truncate text-sm font-medium text-primary-500 peer-focus:font-bold peer-focus:text-focus-field">
        {{ label() }}
      </label>
    </div>
  `,
  styles: [],
  viewProviders: [{ provide: ControlContainer, useExisting: FormGroupDirective }],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FvFieldComponent {
  /* Inputs */
  label = input.required<string>();
  name = input.required<string>();
  type = input<InputType>('text');
  min = input<number | null>(null);
  max = input<number | null>(null);
  step = input<string | null>(null);
}
