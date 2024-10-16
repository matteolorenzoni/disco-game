import { Pipe, type PipeTransform } from '@angular/core';
import { EventTeamUserChallenge } from '../model/event-team-user.model';

@Pipe({
  name: 'getUserTotalPoints',
  standalone: true
})
export class GetUserTotalPointsPipe implements PipeTransform {
  transform(challenges: EventTeamUserChallenge[], eventChallengeId?: string): number {
    return challenges.reduce((acc, cur) => {
      if (eventChallengeId && cur.eventChallengeId !== eventChallengeId) return acc;
      return acc + cur.totalPoints;
    }, 0);
  }
}
