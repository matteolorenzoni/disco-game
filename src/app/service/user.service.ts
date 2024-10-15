import { inject, Injectable, signal } from '@angular/core';
import { environment } from '../../environments/environment';
import { User, UserRole } from '../model/user.model';
import { Doc } from '../model/firebase';
import { UserModel } from '../model/form.model';
import { userConverter } from '../model/converter';
import { LogService } from './log.service';
import { FirebaseService } from './firebase.service';
import { FirebaseDocumentService } from './firebase-document.service';
import { HttpService } from './http.service';

const COL_USERS = environment.collection.USERS;
const COL_EVENT_TEAM_USERS = environment.collection.EVENT_TEAM_USERS;

@Injectable({
  providedIn: 'root'
})
export class UserService {
  /* Services */
  readonly firebaseService = inject(FirebaseService);
  readonly documentService = inject(FirebaseDocumentService);
  readonly httpService = inject(HttpService);
  readonly logService = inject(LogService);

  /* Variables */
  user = signal<Doc<User> | undefined>(undefined);

  /* --------------------------- Read ---------------------------*/
  public async getUserById(userId: string): Promise<Doc<User>> {
    return await this.httpService.execute(async () => {
      return await this.documentService.getDocumentById<User>(COL_USERS, userId, userConverter);
    });
  }

  private async getUsers(): Promise<Doc<User>[]> {
    return await this.httpService.execute(async () => {
      return await this.documentService.getAllActiveDocuments<User>(COL_USERS, userConverter);
    });
  }

  public async checkUniqUsername(userName: string): Promise<boolean> {
    return await this.httpService.execute(async () => {
      const userDocs = await this.getUsers();
      const usernames = userDocs.map((user) => user.props.userName);
      if (usernames.includes(userName.toLowerCase())) {
        this.logService.addLogConfirm("L'userName scelto non è disponibile, si prega di sceglierne un altro.");
        return false;
      }
      return true;
    });
  }

  /* --------------------------- Create ---------------------------*/
  public async addUserById(userId: string, userModelForm: UserModel, imageUrl: string | null): Promise<void> {
    return await this.httpService.execute(async () => {
      await this.documentService.addDocumentById<User>(userId, COL_USERS, {
        ...userModelForm,
        imageUrl,
        role: UserRole.USER,
        eventTeamUserRefs: [],
        isActive: true,
        updatedAt: new Date()
      });
      this.logService.addLogConfirm('Utente registrato');
    });
  }

  /* --------------------------- Update ---------------------------*/
  public async updateUser(
    userId: string,
    userModelForm: UserModel,
    imageUrl: string | null | undefined
  ): Promise<void> {
    return await this.httpService.execute(async () => {
      const form: Partial<User> = { ...userModelForm, updatedAt: new Date() };
      if (imageUrl !== undefined) form.imageUrl = imageUrl;
      await this.documentService.updateDocument<User>(userId, COL_USERS, form);
      this.logService.addLogConfirm('Utente aggiornato');
    });
  }

  public async updateEventTeamUser(userId: string, eventTeamUserId: string): Promise<void> {
    return await this.httpService.execute(async () => {
      await this.documentService.updateArrayPropReference<User>(
        'add',
        'eventTeamUserRefs',
        `${COL_USERS}/${userId}`,
        `${COL_EVENT_TEAM_USERS}/${eventTeamUserId}`
      );
    });
  }
}
