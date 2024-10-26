import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { TitleComponent } from '../../../components/title/title.component';
import { Event } from '../../../model/event.model';
import { Doc } from '../../../model/firebase';
import { EventService } from '../../../service/event.service';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faArrowLeft, faArrowRight } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-leaderboard',
  standalone: true,
  imports: [CommonModule, TitleComponent, FaIconComponent],
  templateUrl: './leaderboard.component.html',
  styleUrls: ['./leaderboard.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LeaderboardComponent implements OnInit {
  /* Services */
  private readonly eventService = inject(EventService);

  /* Variable */
  mode = signal<'live' | 'general'>('live');
  events = signal<Doc<Event>[]>([]);
  eventSelected = signal<Doc<Event> | undefined>(undefined);
  eventIndex = signal<number>(0);

  /* Icons */
  ICON_LEFT = faArrowLeft;
  ICON_RIGHT = faArrowRight;

  /* -------------------- Lifecycle hooks -------------------- */
  async ngOnInit(): Promise<void> {
    const events = await this.eventService.getActiveEvents();
    this.events.set(events);
    this.eventSelected.set(events[0]);
  }

  /* -------------------- Methods firebase -------------------- */
  private async getLeaderboard(): Promise<void> {
    // test
  }

  /* -------------------- Methods event -------------------- */
  protected onArrowClick(index: -1 | 1): void {
    const length = this.events().length;
    this.eventIndex.update((currentIndex) => {
      const newIndex = (currentIndex + index + length) % length;
      this.eventSelected.set(this.events()[newIndex]);
      return newIndex;
    });
  }
}
