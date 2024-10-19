import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { ChallengeStatus } from '../model/event-challenge.model';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faCheck, faCirclePause, faLock, faTrash } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'fv-challenge-status',
  standalone: true,
  imports: [CommonModule, FaIconComponent],
  template: `
    @switch (type()) {
      @case ('icon') {
        @switch (challengeStatus()) {
          @case (CHALLENGE_STATUS.ACTIVE) {
            <fa-icon [icon]="ICON_ACTIVE"></fa-icon>
          }
          @case (CHALLENGE_STATUS.LOCKED) {
            <fa-icon [icon]="ICON_LOCKED"></fa-icon>
          }
          @case (CHALLENGE_STATUS.CANCELED) {
            <fa-icon [icon]="ICON_CANCELED"></fa-icon>
          }
          @case (CHALLENGE_STATUS.SUSPENDED) {
            <fa-icon [icon]="ICON_SUSPENDED"></fa-icon>
          }
        }
      }
      @case ('effect') {
        @switch (challengeStatus()) {
          @case (CHALLENGE_STATUS.LOCKED) {
            <div class="absolute left-0 top-0 h-full w-full rounded-xl bg-black/25 backdrop-blur"></div>
            <fa-icon class="absolute -right-1 -top-2 text-xl text-white" [icon]="ICON_LOCKED"></fa-icon>
          }
          @case (CHALLENGE_STATUS.CANCELED) {
            <div class="absolute left-0 top-0 h-full w-full rounded-xl bg-black/75"></div>
            <fa-icon class="absolute -right-1 -top-2 text-xl text-white" [icon]="ICON_CANCELED"></fa-icon>
          }
          @case (CHALLENGE_STATUS.SUSPENDED) {
            <div class="absolute left-0 top-0 h-full w-full rounded-xl bg-sky-400/25"></div>
            <fa-icon class="absolute -right-1 -top-2 text-xl text-white" [icon]="ICON_SUSPENDED"></fa-icon>
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
  challengeStatus = input.required<ChallengeStatus>();

  /* Enum */
  CHALLENGE_STATUS = ChallengeStatus;

  /* Icons */
  ICON_ACTIVE = faCheck;
  ICON_LOCKED = faLock;
  ICON_CANCELED = faTrash;
  ICON_SUSPENDED = faCirclePause;
}
