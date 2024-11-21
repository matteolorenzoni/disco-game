import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { ChallengeStatus } from '../model/event-challenge.model';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faCheck, faCirclePause, faClock, faLock, faTrash } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'fv-challenge-status',
  standalone: true,
  imports: [CommonModule, FaIconComponent],
  template: `
    @switch (type()) {
      @case ('icon') {
        @switch (status()) {
          @case (CHALLENGE_STATUS.ACTIVE) {
            <fa-icon class="text-emerald-600" [icon]="ICON_ACTIVE"></fa-icon>
          }
          @case (CHALLENGE_STATUS.LOCKED) {
            <fa-icon class="text-gray-400" [icon]="ICON_LOCKED"></fa-icon>
          }
          @case (CHALLENGE_STATUS.CANCELED) {
            <fa-icon class="text-rose-600" [icon]="ICON_CANCELED"></fa-icon>
          }
          @case (CHALLENGE_STATUS.SUSPENDED) {
            <fa-icon class="text-sky-600" [icon]="ICON_SUSPENDED"></fa-icon>
          }
        }
      }
      @case ('effect') {
        @switch (status()) {
          @case (CHALLENGE_STATUS.ACTIVE) {
            @if (startDate() && startDate()!.getTime() > NOW.getTime()) {
              <div class="absolute left-0 top-0 h-full w-full rounded-md bg-black/25 backdrop-blur-sm flex-center">
                @if (detail()) {
                  <p class="text-sm">
                    <fa-icon class="mr-2" [icon]="ICON_CLOCK"></fa-icon>{{ startDate() | date: 'HH:mm' }}
                  </p>
                }
              </div>
              @if (detail()) {
                <fa-icon class="absolute -right-1 -top-2 text-xl text-gray-400" [icon]="ICON_LOCKED"></fa-icon>
              }
            }
          }
          @case (CHALLENGE_STATUS.LOCKED) {
            <div class="absolute left-0 top-0 h-full w-full rounded-md bg-black/25 backdrop-blur-sm"></div>
            @if (detail()) {
              <fa-icon class="absolute -right-1 -top-2 text-xl text-gray-400" [icon]="ICON_LOCKED"></fa-icon>
            }
          }
          @case (CHALLENGE_STATUS.CANCELED) {
            <div class="absolute left-0 top-0 h-full w-full rounded-md bg-rose-600/25"></div>
            @if (detail()) {
              <fa-icon class="absolute -right-1 -top-2 text-xl text-rose-600" [icon]="ICON_CANCELED"></fa-icon>
            }
          }
          @case (CHALLENGE_STATUS.SUSPENDED) {
            <div class="absolute left-0 top-0 h-full w-full rounded-md bg-sky-600/25"></div>
            @if (detail()) {
              <fa-icon class="absolute -right-1 -top-2 text-xl text-sky-600" [icon]="ICON_SUSPENDED"></fa-icon>
            }
          }
        }
      }
    }
  `,
  styles: [],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FvChallengeStatusComponent {
  /* Input */
  type = input.required<'icon' | 'effect'>();
  status = input.required<ChallengeStatus>();
  startDate = input<Date | null>(null);
  detail = input<boolean>(false);

  /* Constants */
  NOW = new Date();

  /* Enum */
  CHALLENGE_STATUS = ChallengeStatus;

  /* Icons */
  ICON_ACTIVE = faCheck;
  ICON_LOCKED = faLock;
  ICON_CANCELED = faTrash;
  ICON_SUSPENDED = faCirclePause;
  ICON_CLOCK = faClock;
}
