/* eslint-disable @typescript-eslint/no-unused-vars */
import { inject, Injectable } from '@angular/core';
import { UserCredential } from 'firebase/auth';
import { where } from 'firebase/firestore';
import { environment } from '../../environments/environment';
import { userConverter } from '../model/converter';
import { Doc } from '../model/firebase';
import { UserModel } from '../model/form.model';
import { User, UserParticipation, UserRole } from '../model/user.model';
import { generateUniqueCode } from '../util/utils';
import { FirebaseDocumentService } from './firebase-document.service';
import { StorageService } from './storage.service';

const COL_USERS = environment.collection.USERS;

@Injectable({
  providedIn: 'root'
})
export class UserService {
  /* Services */
  private readonly documentService = inject(FirebaseDocumentService);
  protected readonly storageService = inject(StorageService);

  /* --------------------------- Read ---------------------------*/
  public async getUser(): Promise<Doc<User>[]> {
    return this.documentService.getDocumentsWithConstraints<User>(COL_USERS, [], userConverter);
  }
  public async getUserById(userId: string): Promise<Doc<User>> {
    return this.documentService.getDocumentById<User>(COL_USERS, userId, userConverter);
  }

  public async getUserByUsername(userName: string): Promise<Doc<User> | null> {
    const valueConstraints = [where('userName', '==', userName)];
    return await this.documentService.getDocumentWithConstraints<User>(COL_USERS, valueConstraints, userConverter);
  }

  public async getUserByCode(code: string): Promise<Doc<User> | null> {
    const valueConstraints = [where('code', '==', code)];
    return await this.documentService.getDocumentWithConstraints<User>(COL_USERS, valueConstraints, userConverter);
  }

  public async getUsersByIds(userIds: string[]): Promise<Doc<User>[]> {
    return this.documentService.getDocumentsByIds<User>(COL_USERS, userIds, userConverter);
  }

  public async getUsersCount(): Promise<number> {
    return this.documentService.getDocumentCountWithConstraints<User>(COL_USERS, [], userConverter);
  }

  /* --------------------------- Create ---------------------------*/
  public async add(userCredential: UserCredential, userModelForm: UserModel, imageUrl: string | null): Promise<void> {
    /* Check codice univoco */
    const code = await generateUniqueCode(6, 100, this.getUserByCode.bind(this));

    /* Escludi la password dal userModelForm */
    const { password, ...userWithoutPassword } = userModelForm;

    await this.documentService.addDocumentById<User>(userCredential.user.uid, COL_USERS, {
      ...userWithoutPassword,
      birthDate: new Date(userWithoutPassword.birthDate),
      imageUrl,
      role: UserRole.USER,
      code,
      participations: [],
      isActive: true,
      registeredAt: userCredential.user.metadata.creationTime
        ? new Date(userCredential.user.metadata.creationTime)
        : new Date(),
      updatedAt: new Date()
    });
  }

  public async addImage(image: File, name: string) {
    return await this.storageService.saveImage(image, COL_USERS, name);
  }

  /* --------------------------- Update ---------------------------*/
  public async update(userId: string, userModelForm: UserModel, imageUrl: string | null): Promise<void> {
    /* Escludi la password dal userModelForm */
    const { password, ...userWithoutPassword } = userModelForm;

    /* Aggiorno user ed eventualmente immagine */
    await this.documentService.updateDocuments<User>([userId], COL_USERS, {
      ...userWithoutPassword,
      imageUrl,
      birthDate: new Date(userWithoutPassword.birthDate),
      updatedAt: new Date()
    });
  }

  public async updateImage(image: File, name: string): Promise<string> {
    return await this.storageService.updateImage(image, COL_USERS, name);
  }

  public async updateParticipations(
    operation: 'ADD' | 'REMOVE',
    userId: string,
    eventId: string,
    teamId: string
  ): Promise<void> {
    await this.documentService.updateDocumentArray<User, UserParticipation>(
      operation,
      userId,
      COL_USERS,
      'participations',
      { eventId, teamId }
    );
  }

  /* --------------------------- Delete ---------------------------*/
  public async deleteImage(name: string): Promise<void> {
    await this.storageService.deleteImage(COL_USERS, name);
  }
}
