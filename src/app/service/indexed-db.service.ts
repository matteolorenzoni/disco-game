/* eslint-disable @typescript-eslint/no-explicit-any */
import { Injectable } from '@angular/core';
import { openDB, DBSchema } from 'idb';
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
  leaderboard: { key: string; value: IndexDB<Team> };
}

type ObjectKey = 'events' | 'teams' | 'challenges' | 'leaderboard';

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

  public async deleteItems<T extends { id: string }>(object: ObjectKey, items: T[]): Promise<void> {
    try {
      const db = await openDB(DB_NAME, DB_VERSION);
      const tx = db.transaction(object, 'readwrite');
      const store = tx.objectStore(object);
      await Promise.all(items.map((item) => store.delete(item.id)));
      await tx.done;
    } catch (error) {
      console.error('Error indexedDB:', error);
    }
  }

  public async clearAll(): Promise<void> {
    const db = await openDB(DB_NAME, DB_VERSION);
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
    /* Salvo i nuovi items */
    const indexedDbItems = items.map((x) => ({ id: x.id, ...x.props }));
    await this.saveItems('events', indexedDbItems);

    /* Elimino item scaduti */
    const events = await this.getEvents();
    const eventsToDelete = events.filter((x) => x.props.startDate < dateYesterday());
    this.deleteItems('events', eventsToDelete);
  }

  public async getEvents(): Promise<Doc<Event>[]> {
    const dbEvents = await this.getAllItems<Event>('events');
    dbEvents.sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
    return dbEvents.map(({ id, ...props }) => ({ id, props }));
  }

  /* ---------------------------------- Team ---------------------------------- */
  public async saveTeams(items: Doc<Team>[]): Promise<void> {
    const indexedDbItems = items.map((x) => ({ id: x.id, ...x.props }));
    await this.saveItems('teams', indexedDbItems);

    /* Elimino item scaduti */
    const teams = await this.getTeams();
    const teamsToDelete = teams.filter((x) => x.props.eventStartDate < dateYesterday());
    this.deleteItems('teams', teamsToDelete);
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

  /* ---------------------------------- Challenge ---------------------------------- */
  public async saveChallenges(items: MergeChallenge[]): Promise<void> {
    await this.saveItems('challenges', items);

    /* Elimino tutti gli item */
    const challenges = await this.getChallenges();
    this.deleteItems('challenges', challenges);
  }

  public async getChallenges(): Promise<MergeChallenge[]> {
    const dbChallenges = await this.getAllItems<MergeChallenge>('challenges');
    dbChallenges.sort((a, b) => a.name.localeCompare(b.name));
    return dbChallenges;
  }

  /* ---------------------------------- Leaderboard ---------------------------------- */
  public async saveLeaderboard(items: Doc<Team>[]): Promise<void> {
    const indexedDbItems = items.map((x) => ({ id: x.id, ...x.props }));
    await this.saveItems('leaderboard', indexedDbItems);

    /* Elimino item scaduti */
    const leaderboard = await this.getLeaderboard();
    const teamsToDelete = leaderboard.filter((x) => x.props.eventStartDate < dateYesterday());
    this.deleteItems('leaderboard', teamsToDelete);
  }

  private async getLeaderboard(): Promise<Doc<Team>[]> {
    const dbLeaderboard = await this.getAllItems<Team>('leaderboard');
    return dbLeaderboard.map(({ id, ...props }) => ({ id, props }));
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
}
