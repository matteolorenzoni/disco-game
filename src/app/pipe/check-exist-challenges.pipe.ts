import { Pipe, type PipeTransform } from '@angular/core';
import { Doc } from '../model/firebase';
import { Challenge } from '../model/challenge.model';

@Pipe({
  name: 'check_exist_challenges',
  standalone: true
})
export class CheckExistChallengesPipe implements PipeTransform {
  transform(eventId: string | undefined, checkChallenges: Map<string, Doc<Challenge>[]>): Doc<Challenge>[] {
    return eventId ? (checkChallenges.get(eventId) ?? []) : [];
  }
}
