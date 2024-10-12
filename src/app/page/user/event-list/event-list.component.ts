import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { trigger, transition, style, animate } from '@angular/animations';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faCrown, faPeopleGroup } from '@fortawesome/free-solid-svg-icons';
import { Doc } from '../../../model/firebase';
import { Event } from '../../../model/event.model';
import { FindTeamModel, FromMap, NewTeamModel } from '../../../model/form.model';
import { UserEventTeam } from '../../../model/user-event-team.model';
import { CheckExistTeamPipe } from '../../../pipe/check-exist-team.pipe';
import { EventService } from '../../../service/event.service';
import { FirebaseService } from '../../../service/firebase.service';
import { LogService } from '../../../service/log.service';
import { TeamService } from '../../../service/team.service';
import { UserEventTeamService } from '../../../service/user-event-team.service';
import { UserService } from '../../../service/user.service';
import { FvFieldIconComponent } from '../../../components/fv-field-icon.component';

@Component({
  selector: 'app-event-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FaIconComponent, FvFieldIconComponent, CheckExistTeamPipe],
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
  readonly router = inject(Router);
  readonly firebaseService = inject(FirebaseService);
  readonly userService = inject(UserService);
  readonly eventService = inject(EventService);
  readonly teamService = inject(TeamService);
  readonly userEventTeamService = inject(UserEventTeamService);
  readonly logService = inject(LogService);

  /* Variables */
  events = signal<Doc<Event>[]>([]);
  eventIdSelected = signal<string | undefined>(undefined);
  userEventTeams = signal<Doc<UserEventTeam>[]>([]);
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
  ICON_CROWN = faCrown;
  ICON_TEAM = faPeopleGroup;

  /* -------------------- Lifecycle hooks -------------------- */
  async ngOnInit(): Promise<void> {
    const user = this.userService.user();
    if (!user) throw new Error('retry', { cause: 'retry' });

    /* Event e UserEventTeams */
    const [events, userEventTeams] = await Promise.all([
      this.eventService.getEvents(),
      this.userEventTeamService.getUserEventTeamByProp('userId', user.id)
    ]);
    this.events.set(events);
    this.eventIdSelected.set(events[0].id);
    this.userEventTeams.set(userEventTeams);
  }

  /* -------------------- Methods: firebase -------------------- */
  protected async addTeam(): Promise<void> {
    const user = this.userService.user();
    const eventId = this.eventIdSelected();
    if (!user || !eventId) throw new Error('retry', { cause: 'retry' });

    /* Aggiungo Team al DB */
    const form = this.newTeamForm.getRawValue();
    const { teamId, teamCode } = await this.teamService.addTeam(user.id, eventId, form);

    /* Aggiungo UserEventTeam al DB */
    const userEventTeamRef = await this.userEventTeamService.addUserEventTeam(
      user.id,
      eventId,
      teamId,
      user.id,
      user.props.userName,
      form.name
    );

    /* Aggiorno User (prop: userEventTeamRefs) */
    await this.userService.updateUserEventTeam(user.id, userEventTeamRef.id);

    /* Aggiorno Event (prop: userEventTeamRefs) */
    await this.eventService.updateUserEventTeam(eventId, userEventTeamRef.id);

    /* Aggiorno Team (prop: userEventTeamRefs) */
    await this.teamService.updateUserEventTeam(teamId, userEventTeamRef.id);

    /* Log */
    navigator.clipboard.writeText(teamCode);
    this.logService.addLogConfirm(`Squadra creata! Codice ${teamCode} negli appunti`);

    /* Chiude modal e reset form */
    this.resetModalsAndForms();
  }

  protected async findTeam(): Promise<void> {
    const user = this.userService.user();
    const eventId = this.eventIdSelected();
    if (!user || !eventId) throw new Error('retry', { cause: 'retry' });

    const form = this.findTeamForm.getRawValue();
    const team = await this.teamService.getTeamByCode(form.code);
    if (!team) {
      this.logService.addLogError(user.id, 'Nessuna squadra trovata');
      return;
    }

    /* Aggiungo UserEventTeam al DB */
    const userEventTeamRef = await this.userEventTeamService.addUserEventTeam(
      user.id,
      eventId,
      team.id,
      team.props.leaderId,
      user.props.userName,
      team.props.name
    );

    /* Aggiorno User (prop: userEventTeamRefs) */
    await this.userService.updateUserEventTeam(user.id, userEventTeamRef.id);

    /* Aggiorno Event (prop: userEventTeamRefs) */
    await this.eventService.updateUserEventTeam(eventId, userEventTeamRef.id);

    /* Aggiorno Team (prop: userEventTeamRefs) */
    await this.teamService.updateUserEventTeam(team.id, userEventTeamRef.id);

    /* Log */
    this.logService.addLogConfirm('Ora fai parte della squadra, buona fortuna');

    /* reset form */
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

  protected async goToTeam(eventId: string, teamId: string): Promise<void> {
    await this.router.navigate([`user/events/${eventId}/${teamId}`]);
  }
}
