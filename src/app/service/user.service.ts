import { computed, inject, Injectable } from '@angular/core';
import { environment } from '../../environments/environment.development';
import { User } from '../model/user.model';
import { UserRole } from '../model/user.model';
import { Doc } from '../model/firebase.model';
import { SignUpModel } from '../model/form.model';
import { userConverter } from '../model/converter.model';
import { LogService } from './log.service';
import { FirebaseService } from './firebase.service';
import { FirebaseDocumentService } from './firebase-document.service';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  /* Services */
  readonly firebaseService = inject(FirebaseService);
  readonly documentService = inject(FirebaseDocumentService);
  readonly logService = inject(LogService);

  /* Variables */
  userId = computed(() => this.firebaseService.userFirebase()?.uid);
  user = computed(async () => {
    const userId = this.userId();
    try {
      // User
      if (userId && window.location.pathname !== '/sign-up') {
        const user = await this.getUserById(userId);
        return user.props;
      } else {
        return null;
      }
    } catch (error) {
      this.logService.addLogError(userId, error);
      throw error;
    }
  });

  /* Constants */
  COLLECTION = environment.collection.USERS;

  /* --------------------------- Read ---------------------------*/
  public async getUserById(userId: string): Promise<Doc<User>> {
    return await this.documentService.getDocumentById<User>(this.COLLECTION, userId, userConverter);
  }

  private async getUsers(): Promise<Doc<User>[]> {
    return await this.documentService.getAllDocuments<User>(this.COLLECTION, userConverter);
  }

  /* --------------------------- Create ---------------------------*/
  public async addUser(id: string, form: SignUpModel, imageUrl: string | null): Promise<void> {
    /* Generazione un codice univoco */
    const userDocs = await this.getUsers();
    const { usernames, codes } = userDocs.reduce(
      (acc, cur) => ({
        usernames: [...acc.usernames, cur.props.username.toLowerCase()],
        codes: [...acc.codes, cur.props.defaultCode]
      }),
      { usernames: [] as string[], codes: [] as string[] }
    );

    if (usernames.includes(form.username.toLowerCase())) {
      throw new Error('usernameNotAvailable', { cause: 'usernameNotAvailable' });
    }

    let defaultCode = this.generateRandomCode(6);
    while (codes.length < 2_000_000 && codes.includes(defaultCode)) {
      defaultCode = this.generateRandomCode(6);
    }

    /* Aggiunta documento a DB */
    await this.documentService.addDocumentById<User>(id, this.COLLECTION, {
      ...form,
      birthDate: new Date(form.birthDate),
      imageUrl,
      role: UserRole.USER,
      defaultCode,
      challengePoints: [],
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Log
    this.logService.addLogConfirm('Utente registrato correttamente');
  }

  /* --------------------------- Util ---------------------------*/
  private generateRandomCode(length: number): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * chars.length);
      result += chars[randomIndex];
    }
    return result;
  }
}
