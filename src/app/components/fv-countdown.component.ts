/* eslint-disable @typescript-eslint/no-explicit-any */
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, OnDestroy, OnInit, signal } from '@angular/core';

@Component({
  selector: 'fv-countdown',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (date() && date()!.getTime() - currentDate().getTime() > 0) {
      <p>{{ hours() }}:{{ minutes() | number: '2.0' }}:{{ seconds() | number: '2.0' }}</p>
    } @else {
      <p>Attivo</p>
    }
  `,
  styles: [],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FvCountdownComponent implements OnInit, OnDestroy {
  /* Inputs */
  date = input.required<Date | null>();

  /* Variables */
  intervalId = signal<any>(undefined);
  currentDate = signal<Date>(new Date());
  hours = computed(() => {
    const date = this.date();
    if (!date) return 0;

    const timeLeft = date.getTime() - this.currentDate().getTime();
    return Math.floor(timeLeft / (1000 * 60 * 60));
  });
  minutes = computed(() => {
    const date = this.date();
    if (!date) return 0;

    const timeLeft = date.getTime() - this.currentDate().getTime();
    return Math.floor((timeLeft / (1000 * 60)) % 60);
  });
  seconds = computed(() => {
    const date = this.date();
    if (!date) return 0;

    const timeLeft = date.getTime() - this.currentDate().getTime();
    return Math.floor((timeLeft / 1000) % 60);
  });

  ngOnInit() {
    this.intervalId.set(setInterval(() => this.currentDate.set(new Date()), 1000));
  }

  ngOnDestroy() {
    clearInterval(this.intervalId());
  }
}
