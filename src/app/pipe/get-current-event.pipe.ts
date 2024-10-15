import { Pipe, type PipeTransform } from '@angular/core';
import { Doc } from '../model/firebase';
import { Challenge } from '../model/challenge.model';
import { Team } from '../model/team.model';

@Pipe({
  name: 'get_current_event',
  standalone: true
})
export class GetCurrentEvent implements PipeTransform {
  transform(
    eventId: string | undefined,
    checkChallenges: Map<string, { team: Doc<Team> | undefined; challenges: Doc<Challenge>[] }>
  ): { team: Doc<Team> | undefined; challenges: Doc<Challenge>[] } {
    if (!eventId) return { team: undefined, challenges: [] };
    return {
      team: checkChallenges.get(eventId)?.team,
      challenges: checkChallenges.get(eventId)?.challenges ?? []
    };
  }
}
