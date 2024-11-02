/* eslint-disable @typescript-eslint/no-explicit-any */
import { Injectable } from '@angular/core';
import { openDB, DBSchema } from 'idb';
import { Event } from '../model/event.model';
import { Doc, IndexDB } from '../model/firebase';
import { Team } from '../model/team.model';
import { MergeChallenge } from '../util/merge.util';
import { dateYesterday } from '../util/type.util';
import { Challenge } from '../model/challenge.model';

const DB_NAME = 'fv';
const DB_VERSION = 1;

// Definizione dello schema per IndexedDB
interface FvDB1 extends DBSchema {
  events: { key: string; value: IndexDB<Event> };
  teams: { key: string; value: IndexDB<Team> };
  challenges: { key: string; value: MergeChallenge };
  leaderboard: { key: string; value: IndexDB<Team> };
  'admin-challenges': { key: string; value: IndexDB<Challenge> };
  'scanner-event': { key: string; value: IndexDB<Event> };
  'scanner-challenges': { key: string; value: MergeChallenge };
}

type ObjectKey =
  | 'events'
  | 'teams'
  | 'challenges'
  | 'leaderboard'
  | 'admin-challenges'
  | 'scanner-event'
  | 'scanner-challenges';

@Injectable({
  providedIn: 'root'
})
export class IndexedDbService {
  constructor() {
    this.initDB();
  }

  // Inizializzazione del database
  private async initDB() {
    await openDB<FvDB1>(DB_NAME, DB_VERSION, {
      upgrade(db) {
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
          const store = db.createObjectStore('leaderboard', { keyPath: 'id' }) as unknown as IDBObjectStore;
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
    });
  }

  /* ---------------------------------- Event ---------------------------------- */
  public async getAllItems<T>(object: ObjectKey): Promise<IndexDB<T>[]> {
    try {
      const db = await openDB(DB_NAME, DB_VERSION);
      const tx = db.transaction(object, 'readonly');
      const store = tx.objectStore(object);
      return await store.getAll();
    } catch (error) {
      console.error('Error indexedDB', error);
      return [];
    }
  }

  public async getItemsByProp<T extends Record<string, any>>(
    object: ObjectKey,
    prop: { key: Extract<keyof T, string>; value: string }
  ): Promise<IndexDB<T>[]> {
    try {
      const db = await openDB(DB_NAME, DB_VERSION);
      const tx = db.transaction(object, 'readonly');
      const store = tx.objectStore(object);
      const index = store.index(prop.key);
      return await index.getAll(IDBKeyRange.only(prop.value));
    } catch (error) {
      console.error('Error indexedDB', error);
      return [];
    }
  }

  public async saveItems<T extends Record<string, any> & { id: string }>(
    object: ObjectKey,
    items: T[]
  ): Promise<IDBValidKey[] | undefined> {
    try {
      const db = await openDB(DB_NAME, DB_VERSION);
      const tx = db.transaction(object, 'readwrite');
      const store = tx.objectStore(object);
      const promises = items.map((item) => store.put(item));
      const results = await Promise.all(promises);
      await tx.done;
      return results;
    } catch (error) {
      console.error('Error indexedDB:', error);
      return undefined;
    }
  }

  public async deleteItems(object: ObjectKey, itemIds: string[]): Promise<void> {
    try {
      const db = await openDB(DB_NAME, DB_VERSION);
      const tx = db.transaction(object, 'readwrite');
      const store = tx.objectStore(object);
      await Promise.all(itemIds.map((itemId) => store.delete(itemId)));
      await tx.done;
    } catch (error) {
      console.error('Error indexedDB:', error);
    }
  }

  public async clearStore(object: ObjectKey): Promise<void> {
    try {
      const db = await openDB(DB_NAME, DB_VERSION);
      const tx = db.transaction(object, 'readwrite');
      await tx.objectStore(object).clear();
      await tx.done;
    } catch (error) {
      console.error('Error indexedDB:', error);
    }
  }

  public async clearAllStores(): Promise<void> {
    try {
      const db = await openDB(DB_NAME, DB_VERSION);
      const tx = db.transaction(['events', 'teams', 'challenges', 'leaderboard'], 'readwrite');
      await Promise.all([
        tx.objectStore('events').clear(),
        tx.objectStore('teams').clear(),
        tx.objectStore('challenges').clear(),
        tx.objectStore('leaderboard').clear()
      ]);
      await tx.done;
    } catch (error) {
      console.error('Error indexedDB:', error);
    }
  }

  /* ---------------------------------- Event ---------------------------------- */
  public async saveEvents(items: Doc<Event>[]): Promise<void> {
    /* Se l'array è vuoto allora elimino tutti elementi (per gestione su piu dispositivi) */
    if (items.length === 0) {
      this.clearStore('events');
      return;
    }

    /* Salvo i nuovi items */
    const indexedDbItems = items.map((x) => ({ id: x.id, ...x.props }));
    await this.saveItems('events', indexedDbItems);

    /* Elimino item scaduti */
    const events = await this.getEvents();
    const eventsToDelete = events.filter((x) => x.props.startDate < dateYesterday());
    this.deleteItems(
      'events',
      eventsToDelete.map((item) => item.id)
    );
  }

  public async getEvents(): Promise<Doc<Event>[]> {
    const dbEvents = await this.getAllItems<Event>('events');
    dbEvents.sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
    return dbEvents.map(({ id, ...props }) => ({ id, props }));
  }

  /* ---------------------------------- Team ---------------------------------- */
  public async saveTeams(items: Doc<Team>[]): Promise<void> {
    /* Se l'array è vuoto allora elimino tutti elementi (per gestione su piu dispositivi) */
    if (items.length === 0) {
      this.clearStore('teams');
      return;
    }

    /* Salvo i nuovi items */
    const indexedDbItems = items.map((x) => ({ id: x.id, ...x.props }));
    await this.saveItems('teams', indexedDbItems);

    /* Elimino item scaduti */
    const teams = await this.getTeams();
    const teamsToDelete = teams.filter((x) => x.props.eventStartDate < dateYesterday());
    this.deleteItems(
      'teams',
      teamsToDelete.map((item) => item.id)
    );
  }

  public async getTeams(): Promise<Doc<Team>[]> {
    const dbTeams = await this.getAllItems<Team>('teams');
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
    /* Se l'array è vuoto allora elimino tutti elementi (per gestione su piu dispositivi) */
    if (items.length === 0) {
      this.clearStore('challenges');
      return;
    }

    /* Elimino tutti gli item */
    await this.clearStore('challenges');

    /* Salvo i nuovi items */
    await this.saveItems('challenges', items);
  }

  public async getChallenges(): Promise<MergeChallenge[]> {
    const dbChallenges = await this.getAllItems<MergeChallenge>('challenges');
    dbChallenges.sort((a, b) => a.name.localeCompare(b.name));
    return dbChallenges;
  }

  /* ---------------------------------- Leaderboard ---------------------------------- */
  public async saveLeaderboard(items: Doc<Team>[]): Promise<void> {
    /* Se l'array è vuoto allora elimino tutti elementi (per gestione su piu dispositivi) */
    if (items.length === 0) {
      this.clearStore('leaderboard');
      return;
    }

    /* Salvo i nuovi items */
    const indexedDbItems = items.map((x) => ({ id: x.id, ...x.props }));
    await this.saveItems('leaderboard', indexedDbItems);

    /* Elimino item scaduti */
    const dbLeaderboard = await this.getAllItems<Team>('leaderboard');
    const leaderboard = dbLeaderboard.map(({ id, ...props }) => ({ id, props }));
    const teamsToDelete = leaderboard.filter((x) => x.props.eventStartDate < dateYesterday());
    this.deleteItems(
      'leaderboard',
      teamsToDelete.map((item) => item.id)
    );
  }

  public async getLeaderboardByEventId(eventId: string): Promise<Doc<Team>[]> {
    const dbTeams = await this.getItemsByProp<Team>('leaderboard', { key: 'eventId', value: eventId });
    dbTeams.sort((a, b) => {
      const pointsDiff = b.totalPoints - a.totalPoints;
      if (pointsDiff !== 0) return pointsDiff;
      return a.name.localeCompare(b.name);
    });
    return dbTeams.map(({ id, ...props }) => ({ id, props }));
  }

  /* ---------------------------------- Admin ---------------------------------- */
  public async saveAdminChallenges(items: Doc<Challenge>[]): Promise<void> {
    /* Se l'array è vuoto allora elimino tutti elementi (per gestione su piu dispositivi) */
    if (items.length === 0) {
      this.clearStore('leaderboard');
      return;
    }

    /* Elimino tutti gli items */
    await this.clearStore('admin-challenges');

    /* Salvo i nuovi items */
    const indexedDbItems = items.map((x) => ({ id: x.id, ...x.props }));
    await this.saveItems('admin-challenges', indexedDbItems);
  }

  public async getAdminChallenges(): Promise<Doc<Challenge>[]> {
    const dbChallenges = await this.getAllItems<Challenge>('admin-challenges');
    dbChallenges.sort((a, b) => a.name.localeCompare(b.name));
    return dbChallenges.map(({ id, ...props }) => ({ id, props }));
  }

  /* ---------------------------------- Scanner ---------------------------------- */
  public async saveScannerEvent(item: Doc<Event>): Promise<void> {
    /* Elimino tutti gli items */
    await this.clearStore('scanner-event');

    /* Salvo i nuovi items */
    const indexedDbItem = { id: item.id, ...item.props };
    await this.saveItems('scanner-event', [indexedDbItem]);
  }

  public async getScannerEvent(): Promise<Doc<Event> | null> {
    const dbEvents = await this.getAllItems<Event>('scanner-event');
    if (dbEvents.length !== 1) return null;

    const { id, ...props } = dbEvents[0];
    return { id, props };
  }

  public async deleteScannerEvent(): Promise<void> {
    await this.clearStore('scanner-event');
  }

  public async saveScannerChallenges(items: MergeChallenge[]): Promise<void> {
    /* Se l'array è vuoto allora elimino tutti elementi (per gestione su piu dispositivi) */
    if (items.length === 0) {
      this.clearStore('scanner-challenges');
      return;
    }

    /* Elimino tutti gli item */
    await this.clearStore('scanner-challenges');

    /* Salvo i nuovi items */
    await this.saveItems('scanner-challenges', items);
  }

  public async getScannerChallenges(): Promise<MergeChallenge[]> {
    const dbChallenges = await this.getAllItems<MergeChallenge>('scanner-challenges');
    dbChallenges.sort((a, b) => a.name.localeCompare(b.name));
    return dbChallenges;
  }

  public async deleteScannerChallenges(): Promise<void> {
    await this.clearStore('scanner-challenges');
  }
}
