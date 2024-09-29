import { computed, inject, Injectable, signal } from '@angular/core';
import { environment } from '../../environments/environment.development';
import { User } from '../model/user.model';
import { UserGame } from '../model/user-game.model';
import { UserRole } from '../model/user.model';
import { Doc } from '../model/firebase';
import { SignUpModel } from '../model/form.model';
import { userConverter } from '../model/converter';
import { LogService } from './log.service';
import { FirebaseService } from './firebase.service';
import { FirebaseDocumentService } from './firebase-document.service';
import { UserGameService } from './user-game.service';

const COL_USERS = environment.collection.USERS;
const COL_USER_GAMES = environment.collection.GAMES;

@Injectable({
  providedIn: 'root'
})
export class UserService {
  /* Services */
  readonly firebaseService = inject(FirebaseService);
  readonly documentService = inject(FirebaseDocumentService);
  readonly userGamesService = inject(UserGameService);
  readonly logService = inject(LogService);

  /* Variables */
  user = computed(async () => {
    const userId = this.firebaseService.userFirebase()?.uid;
    try {
      // User
      if (userId && window.location.pathname !== '/sign-up') return await this.getUserById(userId);
      else return null;
    } catch (error) {
      this.logService.addLogError(userId, error);
      throw error;
    }
  });
  userGames = signal<Doc<UserGame>[]>([]);

  /* --------------------------- Read ---------------------------*/
  public async getUserById(userId: string): Promise<Doc<User>> {
    // User
    const userDoc = await this.documentService.getDocumentById<User>(COL_USERS, userId, userConverter);

    // User games
    const userGames = await this.userGamesService.getUserGamesByRefs(userDoc.props.games);
    this.userGames.set(userGames);

    return userDoc;
  }

  private async getUsers(): Promise<Doc<User>[]> {
    return await this.documentService.getAllDocuments<User>(COL_USERS, userConverter);
  }

  /* --------------------------- Create ---------------------------*/
  public async addUser(id: string, form: SignUpModel, imageUrl: string | null): Promise<void> {
    /* Controllo username univoco */
    const userDocs = await this.getUsers();
    const usernames = userDocs.map((user) => user.props.username);
    if (usernames.includes(form.username.toLowerCase())) {
      throw new Error('usernameNotAvailable', { cause: 'usernameNotAvailable' });
    }

    /* Aggiunta documento a DB */
    await this.documentService.addDocumentById<User>(id, COL_USERS, {
      ...form,
      birthDate: new Date(form.birthDate),
      imageUrl,
      role: UserRole.USER,
      games: [],
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Log
    this.logService.addLogConfirm('Utente registrato correttamente');
  }

  /* --------------------------- Update ---------------------------*/
  public async updateUserGames(userId: string, userGameId: string): Promise<void> {
    await this.documentService.updateArrayPropReference<User>(
      'add',
      'games',
      `${COL_USERS}/${userId}`,
      `${COL_USER_GAMES}/${userGameId}`
    );
  }
}
