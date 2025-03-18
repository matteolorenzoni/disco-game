/* eslint-disable @typescript-eslint/no-explicit-any */
import { Injectable } from '@angular/core';
import { DBSchema, IDBPDatabase, openDB } from 'idb';
import { Challenge } from '../model/challenge.model';
import { Event } from '../model/event.model';
import { Doc, IndexDB } from '../model/firebase';
import { Team } from '../model/team.model';
import { MergeChallenge } from '../util/merge.util';
import { dateYesterday } from '../util/type.util';

const DB_NAME = 'fv';
const DB_VERSION = 1;

// Definizione dello schema per IndexedDB
interface FvDB1 extends DBSchema {
  events: { key: string; value: IndexDB<Event> };
  teams: { key: string; value: IndexDB<Team> };
  challenges: { key: string; value: MergeChallenge };
  leaderboard: { key: string; value: IndexDB<Team>; indexes: { eventId: string } };
  'admin-challenges': { key: string; value: IndexDB<Challenge> };
  'scanner-event': { key: string; value: IndexDB<Event> };
  'scanner-challenges': { key: string; value: MergeChallenge };
}

type StoreName =
  | 'events'
  | 'teams'
  | 'challenges'
  | 'leaderboard'
  | 'admin-challenges'
  | 'scanner-event'
  | 'scanner-challenges';

const indexedDBIsNotSupported = () => !window.indexedDB;

@Injectable({
  providedIn: 'root'
})
export class IndexedDbService {
  private dbPromise: Promise<IDBPDatabase<FvDB1> | null> | undefined = undefined;

  constructor() {
    this.dbPromise = this.initDB(); // Inizializza la Promise
  }

  // Inizializzazione del database con controllo di compatibilità
  private initDB(): Promise<IDBPDatabase<FvDB1> | null> {
    if (indexedDBIsNotSupported()) {
      console.warn('IndexedDb non supportato');
      return Promise.resolve(null); // Restituisci subito null se IndexedDB non è supportato
    }

    return openDB<FvDB1>(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion) {
        // Verifica versione e setup degli oggetti
        if (oldVersion < 1) {
          if (!db.objectStoreNames.contains('events')) {
            db.createObjectStore('events', { keyPath: 'id' });
          }
          if (!db.objectStoreNames.contains('teams')) {
            db.createObjectStore('teams', { keyPath: 'id' });
          }
          if (!db.objectStoreNames.contains('challenges')) {
            db.createObjectStore('challenges', { keyPath: 'id' });
          }
          if (!db.objectStoreNames.contains('leaderboard')) {
            const store = db.createObjectStore('leaderboard', { keyPath: 'id' });
            store.createIndex('eventId', 'eventId', { unique: false });
          }
          if (!db.objectStoreNames.contains('admin-challenges')) {
            db.createObjectStore('admin-challenges', { keyPath: 'id' });
          }
          if (!db.objectStoreNames.contains('scanner-event')) {
            db.createObjectStore('scanner-event', { keyPath: 'id' });
          }
          if (!db.objectStoreNames.contains('scanner-challenges')) {
            db.createObjectStore('scanner-challenges', { keyPath: 'id' });
          }
        }

        // Controllo di compatibilità per versioni successive
        if (oldVersion < DB_VERSION) {
          console.warn('Database upgrade needed, upgrading...');
          // Logiche di upgrade per versioni successive
        }
      }
    }).catch(() => {
      console.error("Errore nell'apertura del database");
      return null; // Ritorna null in caso di errore nell'apertura del DB
    });
  }

  // Restituisce la connessione al database
  private async getDb(): Promise<IDBPDatabase<FvDB1> | null> {
    if (this.dbPromise === undefined) {
      const db = await this.initDB();
      return db;
    }
    return await this.dbPromise;
  }

  /* ---------------------------------- Utils ---------------------------------- */
  private async deleteItems(storeName: StoreName, itemIds: string[]): Promise<void> {
    const db = await this.getDb();
    if (!db) return;

    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    await Promise.all(itemIds.map((itemId) => store.delete(itemId)));
    await tx.done;
  }

  private async clearStore(storeName: StoreName): Promise<void> {
    const db = await this.getDb();
    if (!db) return;

    const tx = db.transaction(storeName, 'readwrite');
    await tx.objectStore(storeName).clear();
    await tx.done;
  }

  public async clearAllStores(): Promise<void> {
    const db = await this.getDb();
    if (!db) return;

    const tx = db.transaction(['events', 'teams', 'challenges', 'leaderboard'], 'readwrite');
    await Promise.all([
      tx.objectStore('events').clear(),
      tx.objectStore('teams').clear(),
      tx.objectStore('challenges').clear(),
      tx.objectStore('leaderboard').clear()
    ]);
    await tx.done;
  }

  /* ---------------------------------- Event ---------------------------------- */
  public async saveEvents(items: Doc<Event>[]): Promise<void> {
    const db = await this.getDb();
    if (!db) return;

    /* Se l'array è vuoto allora elimino tutti elementi (per gestione su piu dispositivi) */
    if (items.length === 0) {
      this.clearStore('events');
      return;
    }

    /* Salvo i nuovi items */
    const indexedDbItems = items.map((x) => ({ id: x.id, ...x.props }));
    const tx = db.transaction('events', 'readwrite');
    const store = tx.objectStore('events');
    const promises = indexedDbItems.map((item) => store.put(item));
    await Promise.all(promises);
    await tx.done;

    /* Elimino item scaduti */
    const events = await this.getEvents();
    const expiredEvents = events.filter(
      (x) => !x.props.isActive || x.props.endDate.getTime() < dateYesterday().getTime()
    );
    this.deleteItems(
      'events',
      expiredEvents.map((item) => item.id)
    );
  }

  public async getEvents(): Promise<Doc<Event>[]> {
    const db = await this.getDb();
    if (!db) return [];

    const tx = db.transaction('events', 'readonly');
    const store = tx.objectStore('events');
    const dbEvents = await store.getAll();
    dbEvents.sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
    return dbEvents.map(({ id, ...props }) => ({ id, props }));
  }

  /* ---------------------------------- Team ---------------------------------- */
  public async saveTeams(items: Doc<Team>[]): Promise<void> {
    const db = await this.getDb();
    if (!db) return;

    /* Se l'array è vuoto allora elimino tutti elementi (per gestione su piu dispositivi) */
    if (items.length === 0) {
      this.clearStore('teams');
      return;
    }

    /* Salvo i nuovi items */
    const indexedDbItems = items.map((x) => ({ id: x.id, ...x.props }));
    const tx = db.transaction('teams', 'readwrite');
    const store = tx.objectStore('teams');
    const promises = indexedDbItems.map((item) => store.put(item));
    await Promise.all(promises);
    await tx.done;

    /* Elimino gli items scaduti */
    const teams = await this.getTeams();
    const expiredTeams = teams.filter(
      (x) => !x.props.isActive || x.props.eventStartDate.getTime() < dateYesterday().getTime()
    ); // TODO: meglio se endDate
    this.deleteItems(
      'teams',
      expiredTeams.map((item) => item.id)
    );
  }

  public async getTeams(): Promise<Doc<Team>[]> {
    const db = await this.getDb();
    if (!db) return [];

    const tx = db.transaction('teams', 'readonly');
    const store = tx.objectStore('teams');
    const dbTeams = await store.getAll();
    dbTeams.sort((a, b) => {
      const pointsDiff = b.totalPoints - a.totalPoints;
      if (pointsDiff !== 0) return pointsDiff;
      return a.name.localeCompare(b.name);
    });
    return dbTeams.map(({ id, ...props }) => ({ id, props }));
  }

  public async deleteTeams(teamIds: string[]): Promise<void> {
    await this.deleteItems('teams', teamIds);
  }

  /* ---------------------------------- Challenge ---------------------------------- */
  public async saveChallenges(items: MergeChallenge[]): Promise<void> {
    const db = await this.getDb();
    if (!db) return;

    /* Se l'array è vuoto allora elimino tutti elementi (per gestione su piu dispositivi) */
    if (items.length === 0) {
      this.clearStore('challenges');
      return;
    }

    /* Salvo i nuovi items */
    const tx = db.transaction('challenges', 'readwrite');
    const store = tx.objectStore('challenges');
    const promises = items.map((item) => store.put(item));
    await Promise.all(promises);
    await tx.done;

    /* Elimino gli items di eventi scaduti */
    const teams = await this.getChallenges();
    const expiredTeams = teams.filter((x) => x.eventStartDate.getTime() < dateYesterday().getTime()); // TODO: meglio se eventEndDate
    this.deleteItems(
      'challenges',
      expiredTeams.map((item) => item.id)
    );
  }

  public async getChallenges(): Promise<MergeChallenge[]> {
    const db = await this.getDb();
    if (!db) return [];

    const tx = db.transaction('challenges', 'readonly');
    const store = tx.objectStore('challenges');
    const dbChallenges = await store.getAll();
    dbChallenges.sort((a, b) => a.name.localeCompare(b.name));
    return dbChallenges;
  }

  /* ---------------------------------- Leaderboard ---------------------------------- */
  public async saveLeaderboard(items: Doc<Team>[]): Promise<void> {
    const db = await this.getDb();
    if (!db) return;

    /* Se l'array è vuoto allora elimino tutti elementi (per gestione su piu dispositivi) */
    if (items.length === 0) {
      this.clearStore('leaderboard');
      return;
    }

    /* Salvo i nuovi items */
    const indexedDbItems = items.map((x) => ({ id: x.id, ...x.props }));
    const tx = db.transaction('leaderboard', 'readwrite');
    const store = tx.objectStore('leaderboard');
    const promises = indexedDbItems.map((item) => store.put(item));
    await Promise.all(promises);
    await tx.done;

    /* Elimino gli items di eventi scaduti */
    const dbLeaderboard = await store.getAll();
    const leaderboard = dbLeaderboard.map(({ id, ...props }) => ({ id, props }));
    const expiredTeams = leaderboard.filter(
      (x) => !x.props.isActive || x.props.eventStartDate.getTime() < dateYesterday().getTime()
    ); // TODO: meglio se endDate
    this.deleteItems(
      'leaderboard',
      expiredTeams.map((item) => item.id)
    );
  }

  public async getLeaderboardByEventId(eventId: string): Promise<Doc<Team>[]> {
    const db = await this.getDb();
    if (!db) return [];

    const tx = db.transaction('leaderboard', 'readonly');
    const store = tx.objectStore('leaderboard');
    const index = store.index('eventId');
    const dbTeams = await index.getAll(IDBKeyRange.only(eventId));
    dbTeams.sort((a, b) => {
      const pointsDiff = b.totalPoints - a.totalPoints;
      if (pointsDiff !== 0) return pointsDiff;
      return a.name.localeCompare(b.name);
    });
    return dbTeams.map(({ id, ...props }) => ({ id, props }));
  }

  /* ---------------------------------- Admin ---------------------------------- */
  public async saveAdminChallenges(items: Doc<Challenge>[]): Promise<void> {
    const db = await this.getDb();
    if (!db) return;

    /* Se l'array è vuoto allora elimino tutti elementi (per gestione su piu dispositivi) */
    if (items.length === 0) {
      this.clearStore('admin-challenges');
      return;
    }

    /* Salvo i nuovi items */
    const indexedDbItems = items.map((x) => ({ id: x.id, ...x.props }));
    const tx = db.transaction('admin-challenges', 'readwrite');
    const store = tx.objectStore('admin-challenges');
    const promises = indexedDbItems.map((item) => store.put(item));
    await Promise.all(promises);
    await tx.done;

    /* Elimino gli items non più attivi */
    const teams = await this.getAdminChallenges();
    const expiredTeams = teams.filter((x) => !x.props.isActive);
    this.deleteItems(
      'admin-challenges',
      expiredTeams.map((item) => item.id)
    );
  }

  public async getAdminChallenges(): Promise<Doc<Challenge>[]> {
    const db = await this.getDb();
    if (!db) return [];

    const tx = db.transaction('admin-challenges', 'readonly');
    const store = tx.objectStore('admin-challenges');
    const dbChallenges = await store.getAll();
    dbChallenges.sort((a, b) => a.name.localeCompare(b.name));
    return dbChallenges.map(({ id, ...props }) => ({ id, props }));
  }

  /* ---------------------------------- Scanner ---------------------------------- */
  public async saveScannerEvent(item: Doc<Event>): Promise<void> {
    const db = await this.getDb();
    if (!db) return;

    /* Elimino tutti gli items */
    await this.clearStore('scanner-event');

    /* Salvo i nuovi items */
    const indexedDbItem = { id: item.id, ...item.props };
    const tx = db.transaction('scanner-event', 'readwrite');
    const store = tx.objectStore('scanner-event');
    const promises = [indexedDbItem].map((item) => store.put(item));
    await Promise.all(promises);
    await tx.done;

    /* Elimino gli items non più attivi */
    await this.deleteExpiredScannerEvent();
  }

  public async getScannerEvents(): Promise<Doc<Event>[]> {
    const db = await this.getDb();
    if (!db) return [];

    const tx = db.transaction('scanner-event', 'readonly');
    const store = tx.objectStore('scanner-event');
    const dbChallenges = await store.getAll();
    return dbChallenges.map(({ id, ...props }) => ({ id, props }));
  }

  public async deleteScannerEvent(): Promise<void> {
    await this.clearStore('scanner-event');
  }

  public async deleteExpiredScannerEvent(): Promise<void> {
    const events = await this.getScannerEvents();
    const expiredEvents = events.filter(
      (x) => !x.props.isActive || x.props.endDate.getTime() < dateYesterday().getTime()
    ); // TODO: meglio se endDate
    this.deleteItems(
      'scanner-event',
      expiredEvents.map((item) => item.id)
    );
  }
}
