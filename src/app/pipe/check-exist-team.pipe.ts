import { inject, Pipe, type PipeTransform } from '@angular/core';
import { UserService } from '../service/user.service';
import { Doc } from '../model/firebase';
import { UserGame } from '../model/user-game.model';

@Pipe({
  name: 'check_exist_team',
  standalone: true
})
export class CheckExistTeamPipe implements PipeTransform {
  /* Services */
  readonly userService = inject(UserService);

  transform(eventId: string | undefined): Doc<UserGame> | undefined {
    return this.userService.userGames().find((x) => x.props.eventId === eventId);
  }
}
