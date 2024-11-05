import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { ControlContainer, FormGroupDirective, ReactiveFormsModule } from '@angular/forms';

type InputType = 'text' | 'password' | 'email' | 'number' | 'date' | 'datetime-local';

const inputModeMap: { [key in InputType]: string } = {
  text: 'text',
  password: 'text',
  email: 'email',
  number: 'numeric',
  date: 'text',
  'datetime-local': 'text'
};

@Component({
  selector: 'fv-field',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="relative flex flex-col">
      <input
        [id]="name()"
        [type]="type()"
        [attr.inputmode]="inputModeMap[type()]"
        [formControlName]="name()"
        [min]="min()"
        [max]="max()"
        [step]="step()"
        autocomplete="off"
        class="peer mt-6 h-8 w-full rounded border border-field-border bg-field-background px-3 py-2 text-xs text-field-color shadow focus:border-2 focus:outline-none disabled:bg-neutral-700 disabled:text-neutral-600"
        [ngClass]="[
          'focus:border-' + twColor() + '-500',
          'focus:text-' + twColor() + '-200',
          'focus:caret-' + twColor() + '-500'
        ]" />
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
export class FvFieldComponent {
  /* Inputs */
  label = input.required<string>();
  name = input.required<string>();
  type = input<InputType>('text');
  min = input<number | null>(null);
  max = input<number | null>(null);
  step = input<string | null>(null);
  twColor = input<string>('primary');

  inputModeMap: { [key in InputType]: string } = inputModeMap;
}
