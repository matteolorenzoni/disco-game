import { inject, Injectable, signal } from '@angular/core';
import { environment } from '../../environments/environment.development';
import { User, UserRole } from '../model/user.model';
import { Doc } from '../model/firebase';
import { UserModel } from '../model/form.model';
import { userConverter } from '../model/converter';
import { LogService } from './log.service';
import { FirebaseService } from './firebase.service';
import { FirebaseDocumentService } from './firebase-document.service';
import { UserEventTeamService } from './user-event-team.service';

const COL_USERS = environment.collection.USERS;
const COL_USER_EVENT_TEAM = environment.collection.USER_EVENT_TEAMS;

@Injectable({
  providedIn: 'root'
})
export class UserService {
  /* Services */
  readonly firebaseService = inject(FirebaseService);
  readonly documentService = inject(FirebaseDocumentService);
  readonly userGamesService = inject(UserEventTeamService);
  readonly logService = inject(LogService);

  /* Variables */
  user = signal<Doc<User> | undefined>(undefined);

  /* --------------------------- Read ---------------------------*/
  public async getUserById(userId: string): Promise<Doc<User>> {
    return await this.documentService.getDocumentById<User>(COL_USERS, userId, userConverter);
  }

  private async getUsers(): Promise<Doc<User>[]> {
    return await this.documentService.getAllActiveDocuments<User>(COL_USERS, userConverter);
  }

  public async checkUniqUsername(userName: string): Promise<boolean> {
    const userDocs = await this.getUsers();
    const usernames = userDocs.map((user) => user.props.userName);
    if (usernames.includes(userName.toLowerCase())) {
      this.logService.addLogConfirm("L'userName scelto non è disponibile, si prega di sceglierne un altro.");
      return false;
    }
    return true;
  }

  /* --------------------------- Create ---------------------------*/
  public async addUserById(userId: string, userModelForm: UserModel, imageUrl: string | null): Promise<void> {
    await this.documentService.addDocumentById<User>(userId, COL_USERS, {
      ...userModelForm,
      imageUrl,
      role: UserRole.USER,
      userEventTeamRefs: [],
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

  public async updateUserEventTeam(userId: string, userEventTeamId: string): Promise<void> {
    await this.documentService.updateArrayPropReference<User>(
      'add',
      'userEventTeamRefs',
      `${COL_USERS}/${userId}`,
      `${COL_USER_EVENT_TEAM}/${userEventTeamId}`
    );
  }
}
