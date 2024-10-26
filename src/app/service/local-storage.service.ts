import { Injectable } from '@angular/core';
import { AES, enc } from 'crypto-js';
import { environment } from '../../environments/environment';
import { Doc } from '../model/firebase';
import { User } from '../model/user.model';
import { Event } from '../model/event.model';
import { Challenge } from '../model/challenge.model';

const PREFIX = 'FV';

const KEY_USER = 'USER';
const KEY_USER_DASHBOARD_TEAM_ID = 'USER_TEAM_ID';
const KEY_SCANNER_EVENT = 'SCANNER_EVENT';
const KEY_SCANNER_DEVICE_ID = 'SCANNER_DEVICE_ID';
const KEY_SCANNER_CHALLENGES = 'SCANNER_CHALLENGES';

@Injectable({
  providedIn: 'root'
})
export class LocalStorageService {
  /**
   * Crea una chiave con prefisso.
   * @param key La chiave originale.
   * @returns La chiave con prefisso.
   */
  private createKey(key: string): string {
    return `[${PREFIX}]_${key}`;
  }

  /* ------------------------------ Method crittografici ------------------------------ */
  /**
   * Crittografa i dati usando AES.
   * @param data Dati da crittografare.
   * @returns Dati crittografati come stringa.
   */
  private encrypt(data: string): string {
    return AES.encrypt(data, environment.ENCRYPTION_KEY).toString();
  }

  /**
   * Decrittografa i dati crittografati usando AES.
   * @param data Dati crittografati.
   * @returns Dati decrittografati come stringa.
   */
  private decrypt(data: string): string {
    const bytes = AES.decrypt(data, environment.ENCRYPTION_KEY);
    return bytes.toString(enc.Utf8); // Manteniamo questa parte per l'encoding.
  }

  /* ------------------------------ Method  ------------------------------ */
  /**
   * Imposta un valore nel Local Storage.
   * @param key La chiave sotto cui memorizzare il valore.
   * @param value Il valore da memorizzare. Sarà convertito in stringa e crittografato.
   */
  private setItem<T>(key: string, value: T, encrypt = false): void {
    const jsonValue = typeof value === 'string' ? value : JSON.stringify(value);
    const lsValue = encrypt ? this.encrypt(jsonValue) : jsonValue;
    localStorage.setItem(this.createKey(key), lsValue);
  }

  /**
   * Ottiene un valore dal Local Storage.
   * @param key La chiave da cui recuperare il valore.
   * @returns Il valore memorizzato, o null se non esiste.
   */
  private getItem(key: string, decrypt = false): string | null {
    const lsValue = localStorage.getItem(this.createKey(key));
    if (!lsValue) return null;

    const value = decrypt ? this.decrypt(lsValue) : lsValue;
    return value;
  }

  /**
   * Rimuove un valore dal Local Storage.
   * @param key La chiave del valore da rimuovere.
   */
  private removeItem(key: string): void {
    localStorage.removeItem(this.createKey(key));
  }

  /**
   * Controlla se un valore esiste nel Local Storage.
   * @param key La chiave da controllare.
   * @returns true se il valore esiste, altrimenti false.
   */
  private hasItem(key: string): boolean {
    return localStorage.getItem(this.createKey(key)) !== null;
  }

  /**
   * Rimuove solo gli elementi con il prefisso specificato.
   */
  private clear(): void {
    const keysToRemove: string[] = [];

    // Scorri tutte le chiavi nel Local Storage
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(`[${PREFIX}]_`)) {
        keysToRemove.push(key);
      }
    }

    // Rimuovi le chiavi trovate
    keysToRemove.forEach((key) => localStorage.removeItem(key));
  }

  /* ------------------------------ Method app  ------------------------------ */
  /* User */
  public getUser(): Doc<User> | null {
    const stringValue = this.getItem(KEY_USER, true);
    if (!stringValue) return null;
    return JSON.parse(stringValue) as Doc<User>;
  }

  public setUser(user: Doc<User>): void {
    this.setItem<Doc<User>>(KEY_USER, user, true);
  }

  public removeUser(): void {
    return this.removeItem(KEY_USER);
  }

  /* User dashboard */
  public getUserDashboardTeamId(): string | null | undefined {
    return this.getItem(KEY_USER_DASHBOARD_TEAM_ID);
  }

  public setUserDashboardTeamId(teamId: string): void {
    this.setItem<string>(KEY_USER_DASHBOARD_TEAM_ID, teamId);
  }

  public removeUserDashboardTeamId(): void {
    return this.removeItem(KEY_USER_DASHBOARD_TEAM_ID);
  }

  /* Scanner */
  public getScannerEvent(): Doc<Event> | null | undefined {
    const stringValue = this.getItem(KEY_SCANNER_EVENT);
    if (!stringValue) return null;
    return JSON.parse(stringValue) as Doc<Event>;
  }

  public setScannerEvent(event: Doc<Event>): void {
    this.setItem<Doc<Event>>(KEY_SCANNER_EVENT, event);
  }

  public removeScannerEvent(): void {
    return this.removeItem(KEY_SCANNER_EVENT);
  }

  public getScannerDeviceId(): string | null | undefined {
    return this.getItem(KEY_SCANNER_DEVICE_ID);
  }

  public setScannerDeviceId(deviceId: string): void {
    this.setItem<string>(KEY_SCANNER_DEVICE_ID, deviceId);
  }

  public removeScannerDeviceId(): void {
    return this.removeItem(KEY_SCANNER_DEVICE_ID);
  }

  public getScannerChallenges(): Doc<Challenge>[] {
    const stringValue = this.getItem(KEY_SCANNER_CHALLENGES);
    if (!stringValue) return [];
    return JSON.parse(stringValue) as Doc<Challenge>[];
  }

  public setScannerChallenges(challenges: Doc<Challenge>[]): void {
    this.setItem<Doc<Challenge>[]>(KEY_SCANNER_CHALLENGES, challenges);
  }

  public removeScannerChallenges(): void {
    return this.removeItem(KEY_SCANNER_CHALLENGES);
  }
}
