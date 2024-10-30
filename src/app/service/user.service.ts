/* eslint-disable @typescript-eslint/no-unused-vars */
import { inject, Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { User, UserParticipation, UserRole } from '../model/user.model';
import { Doc } from '../model/firebase';
import { UserModel } from '../model/form.model';
import { userConverter } from '../model/converter';
import { LogService } from './log.service';
import { FirebaseService } from './firebase.service';
import { FirebaseDocumentService } from './firebase-document.service';
import { HttpService } from './http.service';
import { generateUniqueCode } from '../util/utils';

const COL_USERS = environment.collection.USERS;

@Injectable({
  providedIn: 'root'
})
export class UserService {
  /* Services */
  readonly firebaseService = inject(FirebaseService);
  readonly documentService = inject(FirebaseDocumentService);
  readonly httpService = inject(HttpService);
  readonly logService = inject(LogService);

  /* --------------------------- Read ---------------------------*/
  public async getUserById(userId: string): Promise<Doc<User>> {
    return await this.httpService.execute(async () => {
      return this.documentService.getDocumentById<User>(COL_USERS, userId, userConverter);
    });
  }

  public async getUserByUsername(userName: string): Promise<Doc<User> | null> {
    return await this.httpService.execute(async () => {
      const users = await this.documentService.getDocumentsByProps<User>(
        COL_USERS,
        { userName, isActive: true },
        userConverter
      );
      return users.length > 0 ? users[0] : null;
    }, 0);
  }

  public async getUserByCode(code: string): Promise<Doc<User> | null> {
    return await this.httpService.execute(async () => {
      const users = await this.documentService.getDocumentsByProps<User>(
        COL_USERS,
        { code, isActive: true },
        userConverter
      );
      return users.length > 0 ? users[0] : null;
    }, 0);
  }

  public async getUsersByIds(userIds: string[]): Promise<Doc<User>[]> {
    return await this.httpService.execute(async () => {
      return this.documentService.getDocumentsByIds<User>(COL_USERS, userIds, userConverter);
    }, 0);
  }

  /* --------------------------- Create ---------------------------*/
  public async addUserById(userId: string, userModelForm: UserModel, imageUrl: string | null): Promise<void> {
    return this.httpService.execute(async () => {
      /* Check user name univoco */
      const user = await this.getUserByUsername(userModelForm.userName);
      if (user) throw new Error('usernameNotAvailable', { cause: 'usernameNotAvailable' });

      /* Check codice univoco */
      const code = await generateUniqueCode(6, 100, this.getUserByCode.bind(this));

      /* Escludi la password dal userModelForm */
      const { password, ...userWithoutPassword } = userModelForm;

      await this.documentService.addDocumentById<User>(userId, COL_USERS, {
        ...userWithoutPassword,
        imageUrl,
        role: UserRole.USER,
        code,
        participations: [],
        isActive: true,
        updatedAt: new Date()
      });
      this.logService.addLogConfirm('Utente registrato');
    }, 0);
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
    }, 0);
  }

  public async updateEventsAndTeams(
    operation: 'ADD' | 'REMOVE',
    userId: string,
    eventId: string,
    teamId: string
  ): Promise<void> {
    return await this.httpService.execute(async () => {
      const user = await this.getUserById(userId);

      if (operation === 'ADD') {
        const participationExists = user.props.participations.some((x) => x.eventId === eventId && x.teamId === teamId);
        if (participationExists) return;

        user.props.participations = [...user.props.participations, { eventId, teamId }];
      } else {
        user.props.participations = user.props.participations.filter(
          (x) => x.eventId !== eventId || x.teamId !== teamId
        );
      }

      await this.documentService.updateDocument<User>(userId, COL_USERS, user.props);
    }, 0);
  }
}
