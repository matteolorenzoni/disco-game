import { computed, inject, Injectable, signal } from '@angular/core';
import { environment } from '../../environments/environment.development';
import { User } from '../model/user.model';
import { UserGame } from '../model/user-game.model';
import { UserRole } from '../model/user.model';
import { Doc } from '../model/firebase';
import { UserModel } from '../model/form.model';
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

  public async checkUniqUsername(username: string): Promise<boolean> {
    const userDocs = await this.getUsers();
    const usernames = userDocs.map((user) => user.props.username);
    if (usernames.includes(username.toLowerCase())) {
      this.logService.addLogConfirm("L'username scelto non è disponibile, si prega di sceglierne un altro.");
      return false;
    }
    return true;
  }

  /* --------------------------- Create ---------------------------*/
  public async addUser(id: string, userModelForm: UserModel, imageUrl: string | null): Promise<void> {
    await this.documentService.addDocumentById<User>(id, COL_USERS, {
      ...userModelForm,
      // birthDate: new Date(form.birthDate),
      imageUrl,
      role: UserRole.USER,
      games: [],
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    this.logService.addLogConfirm('Utente registrato correttamente');
  }

  /* --------------------------- Update ---------------------------*/
  public async updateUser(
    userId: string,
    userModelForm: UserModel,
    imageUrl: string | null | undefined
  ): Promise<void> {
    const form: Partial<User> = { ...userModelForm, updatedAt: new Date() };
    if (imageUrl !== undefined) form.imageUrl = imageUrl;
    await this.documentService.updateDocument<User>(userId, COL_USERS, form);
    this.logService.addLogConfirm('Utente aggiornato correttamente');
  }

  public async updateUserGames(userId: string, userGameId: string): Promise<void> {
    await this.documentService.updateArrayPropReference<User>(
      'add',
      'games',
      `${COL_USERS}/${userId}`,
      `${COL_USER_GAMES}/${userGameId}`
    );
  }
}
