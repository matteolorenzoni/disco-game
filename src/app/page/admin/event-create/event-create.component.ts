import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-event-create',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './event-create.component.html',
  styleUrls: ['./event-create.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EventCreateComponent implements OnInit {
  /* Services */
  readonly route = inject(ActivatedRoute);

  /* Variables */
  eventId = signal<string | null>(null);

  ngOnInit(): void {
    // Recupera l'ID dalla route
    this.route.paramMap.subscribe((params) => {
      this.eventId.set(params.get('id'));
      console.log(this.eventId());
    });
  }
}
