import { Pipe, type PipeTransform } from '@angular/core';
import { Doc } from '../model/firebase';
import { UserEventTeam } from '../model/user-event-team.model';

@Pipe({
  name: 'check_exist_team',
  standalone: true
})
export class CheckExistTeamPipe implements PipeTransform {
  transform(eventId: string | undefined, userEventTeams: Doc<UserEventTeam>[]): Doc<UserEventTeam> | undefined {
    return userEventTeams.find((x) => x.props.eventId === eventId);
  }
}
