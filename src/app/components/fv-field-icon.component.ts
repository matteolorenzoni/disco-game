import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { ControlContainer, FormGroupDirective, ReactiveFormsModule } from '@angular/forms';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { IconDefinition } from '@fortawesome/free-solid-svg-icons';

type InputType = 'text' | 'password' | 'email' | 'number' | 'datetime-local';

const inputModeMap: { [key in InputType]: string } = {
  text: 'text',
  password: 'text',
  email: 'email',
  number: 'numeric',
  'datetime-local': 'text' // Modifica se necessario
};

@Component({
  selector: 'fv-field-icon',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FaIconComponent],
  template: `
    <div class="relative">
      <input
        [id]="name()"
        [type]="type()"
        [attr.inputmode]="inputModeMap[type()]"
        [formControlName]="name()"
        [placeholder]="label()"
        [min]="min()"
        [max]="max()"
        [step]="step()"
        autocomplete="off"
        class="peer h-8 w-full rounded border border-field-border bg-field-background px-3 py-2 pl-8 text-xs text-field-color shadow focus:border-2 focus:border-primary-500 focus:text-primary-200 focus:caret-primary-500 focus:outline-none disabled:bg-neutral-700 disabled:text-neutral-600" />
      <div
        class="aaaa absolute left-0 top-0 flex h-8 w-8 items-center justify-center rounded text-sm text-field-icon-color peer-focus:text-white">
        <fa-icon [icon]="icon()"></fa-icon>
      </div>
    </div>
  `,
  styles: [],
  viewProviders: [{ provide: ControlContainer, useExisting: FormGroupDirective }],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FvFieldIconComponent {
  /* Inputs */
  label = input.required<string>();
  name = input.required<string>();
  icon = input.required<IconDefinition>();
  type = input<InputType>('text');
  min = input<number | null>(null);
  max = input<number | null>(null);
  step = input<string | null>(null);

  inputModeMap: { [key in InputType]: string } = inputModeMap;
}
