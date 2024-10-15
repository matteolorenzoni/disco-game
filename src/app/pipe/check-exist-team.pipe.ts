import { Pipe, type PipeTransform } from '@angular/core';
import { Doc } from '../model/firebase';
import { EventTeamUser } from '../model/event-team-user.model';

@Pipe({
  name: 'check_exist_team',
  standalone: true
})
export class CheckExistTeamPipe implements PipeTransform {
  transform(eventId: string | undefined, eventTeamUsers: Doc<EventTeamUser>[]): Doc<EventTeamUser> | undefined {
    return eventTeamUsers.find((x) => x.props.eventId === eventId);
  }
}
