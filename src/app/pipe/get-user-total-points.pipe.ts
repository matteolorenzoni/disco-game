import { Pipe, type PipeTransform } from '@angular/core';
import { EventTeamUserChallenge } from '../model/event-team-user.model';

@Pipe({
  name: 'getUserTotalPoints',
  standalone: true
})
export class GetUserTotalPointsPipe implements PipeTransform {
  transform(challenges: EventTeamUserChallenge[], challengeId?: string): number {
    return challenges.reduce((acc, cur) => {
      if (challengeId && cur.challengeId !== challengeId) return acc;
      return acc + cur.totalPoints;
    }, 0);
  }
}
