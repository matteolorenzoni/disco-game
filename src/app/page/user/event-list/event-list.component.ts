import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { ReactiveFormsModule, FormControl, FormGroup, Validators } from '@angular/forms';
import { trigger, transition, style, animate } from '@angular/animations';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faPeopleGroup } from '@fortawesome/free-solid-svg-icons';
import { EventService } from '../../../service/event.service';
import { TeamService } from '../../../service/team.service';
import { FirebaseService } from '../../../service/firebase.service';
import { Event } from '../../../model/event.model';
import { Doc } from '../../../model/firebase.model';
import { FromMap, NewTeamModel, FindTeamModel } from '../../../model/form.model';
import { LogService } from '../../../service/log.service';

@Component({
  selector: 'app-event-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FaIconComponent],
  templateUrl: './event-list.component.html',
  styleUrls: ['./event-list.component.scss'],
  animations: [
    trigger('liAnimation1', [
      transition(':enter', [
        style({ transform: 'scale(0.9)', opacity: 0 }), // Inizia con scale ridotto e opacità 0
        animate('300ms ease-out', style({ transform: 'scale(1)', opacity: 1 })) // Ingrandisci a dimensione naturale
      ]),
      transition(':leave', [
        animate('300ms ease-in', style({ transform: 'scale(0.9)', opacity: 0 })) // Rimpicciolisci a 0.9 e riduci opacità
      ])
    ])
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EventListComponent implements OnInit {
  /* Services */
  readonly firebaseService = inject(FirebaseService);
  readonly eventService = inject(EventService);
  readonly teamService = inject(TeamService);
  readonly logService = inject(LogService);

  /* Variables */
  events = signal<Doc<Event>[]>([]);
  eventIdSelected = signal<string | undefined>(undefined);
  newTeamModalIsOpen = signal<boolean>(false);
  findTeamModalIsOpen = signal<boolean>(false);

  /* Form */
  newTeamForm = new FormGroup<FromMap<NewTeamModel>>({
    name: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(100)]
    })
    // description: new FormControl('', {
    //   nonNullable: true,
    //   validators: [Validators.required, Validators.maxLength(500)]
    // })
  });
  findTeamForm = new FormGroup<FromMap<FindTeamModel>>({
    code: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(6), Validators.maxLength(6)]
    })
  });

  /* Icons */
  ICON_TEAM = faPeopleGroup;

  /* -------------------- Lifecycle hooks -------------------- */
  async ngOnInit(): Promise<void> {
    const events = await this.eventService.getEvents();
    this.events.set(events);
    this.eventIdSelected.set(events[0].id);
  }

  /* -------------------- Methods: firebase -------------------- */
  protected async addTeam(): Promise<void> {
    const userId = this.firebaseService.userFirebase()?.uid;
    const eventId = this.eventIdSelected();
    if (!userId || !eventId) throw new Error('retry', { cause: 'retry' });

    const form = this.newTeamForm.getRawValue();
    await this.teamService.addTeam(userId, eventId, form);
    this.resetModalsAndForms();
  }

  protected async findTeam(): Promise<void> {
    const form = this.findTeamForm.getRawValue();
    const team = await this.teamService.getTeamByCode(form.code);
    if (!team) {
      this.logService.addLogError(this.firebaseService.userFirebase()?.uid, 'Nessuna squadra trovata');
      return;
    }

    const memberId = this.firebaseService.userFirebase()?.uid;
    if (!memberId) throw new Error('retry', { cause: 'retry' });

    await this.teamService.addTeamMember(team.id, memberId);
    this.resetModalsAndForms();
  }

  /* -------------------- Methods: utils -------------------- */
  protected onBackdropClick(event: MouseEvent): void {
    const clickedElement = event.target as HTMLElement;
    if (clickedElement.dataset['dialogBackdrop'] === 'sign-in-modal') {
      this.resetModalsAndForms();
    }
  }

  private resetModalsAndForms(): void {
    this.newTeamModalIsOpen.set(false);
    this.findTeamModalIsOpen.set(false);
    this.newTeamForm.reset();
    this.findTeamForm.reset();
  }
}
