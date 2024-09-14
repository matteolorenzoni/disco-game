import { inject, Injectable } from '@angular/core';
import { FirebaseService } from './firebase.service';
import { environment } from '../../environments/environment.development';
import { User } from '../model/user.model';
import { UserType } from '../model/user.model';
import { Doc } from '../model/firebase.model';
import { SignUpModel } from '../model/form.model';
import { userConverter } from '../model/converter.model';

@Injectable({
  providedIn: 'root'
})
export class FirebaseUserService {
  /* Services */
  readonly firebaseService = inject(FirebaseService);

  /* Constants */
  COLLECTION = environment.collection.USERS;

  /* --------------------------- Read ---------------------------*/
  private async getUserCodes(): Promise<string[]> {
    const users = await this.firebaseService.getAllDocuments<User>(this.COLLECTION);
    return users.map((user) => user.props.defaultCode);
  }

  /* --------------------------- Create ---------------------------*/
  public async addUser(id: string, form: SignUpModel): Promise<void> {
    /* Generazione un codice univoco */
    const codes = await this.getUserCodes();
    let defaultCode = this.generateRandomCode(6);
    while (codes.length < 2_000_000 && codes.includes(defaultCode)) {
      defaultCode = this.generateRandomCode(6);
    }

    /* Aggiunta documento a DB */
    await this.firebaseService.addDocumentById<User>(id, this.COLLECTION, {
      ...form,
      birthDate: new Date(form.birthDate),
      defaultCode,
      type: UserType.USER,
      challengePoints: [],
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }

  public async getUserById(userId: string): Promise<Doc<User>> {
    return await this.firebaseService.getDocumentById<User>(this.COLLECTION, userId, userConverter);
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
