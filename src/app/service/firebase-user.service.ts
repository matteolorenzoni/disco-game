import { inject, Injectable } from '@angular/core';
import { FirebaseService } from './firebase.service';
import { environment } from '../../environments/environment.development';
import { User } from '../model/type.model';
import { UserType } from '../model/enum.model';

@Injectable({
  providedIn: 'root'
})
export class FirebaseUserService {
  /* Services */
  readonly firebaseService = inject(FirebaseService);

  /* Constants */
  COLLECTION = environment.collection.USERS;

  /* --------------------------- Create ---------------------------*/
  private async getUserCodes(): Promise<string[]> {
    const users = await this.firebaseService.getAllDocuments<User>(this.COLLECTION);
    return users.map((user) => user.props.defaultCode);
  }

  /* --------------------------- Create ---------------------------*/
  public async addUser(
    id: string,
    name: string,
    lastname: string,
    username: string,
    birthDate: Date,
    email: string
  ): Promise<void> {
    /* Generazione un codice univoco */
    const codes = await this.getUserCodes();
    let defaultCode = this.generateRandomCode(6);
    while (codes.length < 2_000_000 && codes.includes(defaultCode)) {
      defaultCode = this.generateRandomCode(6);
    }

    /* Aggiunta documento a DB */
    await this.firebaseService.addDocument<User>(this.COLLECTION, {
      id,
      name,
      lastname,
      username,
      birthDate,
      email,
      defaultCode,
      type: UserType.USER,
      challengePoints: [],
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });
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
