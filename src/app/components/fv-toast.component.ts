import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { trigger, style, transition, animate } from '@angular/animations'; // Import per animazioni
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faCircleCheck, faCircleExclamation, faXmark } from '@fortawesome/free-solid-svg-icons';
import { Log, LogService } from '../service/log.service';
import { LogType } from '../model/enum.model';

@Component({
  selector: 'fv-toast',
  standalone: true,
  imports: [CommonModule, FaIconComponent],
  template: `
    <div @fade class="log" [style.backgroundColor]="logProps().color">
      <fa-icon [icon]="logProps().icon"></fa-icon>
      <p>{{ log().message }}</p>
      <fa-icon
        role="button"
        tabindex="0"
        aria-label="Chiudi"
        [icon]="ICON_CLOSE"
        (click)="logService.removeLog(log().id)"
        (keydown)="handleKeydown($event)"></fa-icon>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .log {
        display: grid;
        grid-template-columns: min-content 1fr min-content;
        align-items: center;
        gap: var(--gap-m);
        padding: var(--padding-m);
        color: #ffffff;
        border-radius: 6px;
        box-shadow: rgba(0, 0, 0, 0.24) 0px 3px 8px;
      }
    `
  ],
  animations: [
    trigger('fade', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(100%)' }),
        animate('300ms ease-in', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
      // transition(':leave', [style({ opacity: 1 }), animate('1000ms ease-out', style({ opacity: 0 }))])
    ])
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FvToastComponent {
  /* Service */
  readonly logService = inject(LogService);

  /* Input */
  log = input.required<Log>();

  /* Variables */
  logProps = computed(() => {
    return this.log().type === LogType.ERROR
      ? { color: '#ef4444', icon: faCircleExclamation }
      : { color: '#10b981', icon: faCircleCheck };
  });

  /* Icons */
  ICON_CLOSE = faXmark;

  /* Enum */
  LogType: typeof LogType = LogType;

  /* ------------------------ Methods ------------------------  */
  protected handleKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' || event.key === ' ') {
      this.logService.removeLog(this.log().id);
      event.preventDefault(); // Evita lo scrolling con 'Space'
    }
  }
}
