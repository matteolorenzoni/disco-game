import { Injectable } from '@angular/core';
import { AES, enc } from 'crypto-js';
import { environment } from '../../environments/environment';

const PREFIX = 'FV';

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
  setItem<T>(key: string, value: T): void {
    const jsonValue = JSON.stringify(value);
    const encryptedValue = this.encrypt(jsonValue);
    localStorage.setItem(this.createKey(key), encryptedValue);
  }

  /**
   * Ottiene un valore dal Local Storage.
   * @param key La chiave da cui recuperare il valore.
   * @returns Il valore memorizzato, o null se non esiste.
   */
  getItem<T>(key: string): T | null | undefined {
    try {
      const encryptedValue = localStorage.getItem(this.createKey(key));
      if (encryptedValue) {
        const decryptedValue = this.decrypt(encryptedValue);
        return JSON.parse(decryptedValue) as T;
      }
      return null;
    } catch (error) {
      console.error(error);
      return undefined;
    }
  }

  /**
   * Rimuove un valore dal Local Storage.
   * @param key La chiave del valore da rimuovere.
   */
  removeItem(key: string): void {
    localStorage.removeItem(this.createKey(key));
  }

  /**
   * Controlla se un valore esiste nel Local Storage.
   * @param key La chiave da controllare.
   * @returns true se il valore esiste, altrimenti false.
   */
  hasItem(key: string): boolean {
    return localStorage.getItem(this.createKey(key)) !== null;
  }

  /**
   * Rimuove solo gli elementi con il prefisso specificato.
   */
  clear(): void {
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
}
