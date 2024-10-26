import { Pipe, type PipeTransform } from '@angular/core';
import { TeamUserChallenge } from '../model/team.model';

@Pipe({
  name: 'getUserTotalPoints',
  standalone: true
})
export class GetUserTotalPointsPipe implements PipeTransform {
  transform(challenges: TeamUserChallenge[], challengeId?: string): number {
    return challenges.reduce((acc, cur) => {
      if (challengeId && cur.id !== challengeId) return acc;
      return acc + cur.totalPoints;
    }, 0);
  }
}
