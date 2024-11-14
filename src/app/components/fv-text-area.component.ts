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
        class="peer mt-6 min-h-20 w-full rounded border border-field-border bg-field-background px-3 py-2 text-xs text-field-color shadow-sm focus:border-2 focus:border-focus-field focus:font-semibold focus:text-primary-600 focus:caret-primary-600 focus:outline-none disabled:bg-primary-300 disabled:text-gray-200">
      </textarea>
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
export class FvTextAeraComponent {
  /* Inputs */
  label = input.required<string>();
  name = input.required<string>();
  twColor = input<string>('primary');
}
