import { Injectable } from '@angular/core';
import { openDB, IDBPDatabase, DBSchema } from 'idb';
import { Event } from '../model/event.model';
import { Doc, IndexDB } from '../model/firebase';
import { Team } from '../model/team.model';
import { MergeChallenge } from '../util/merge.util';

// Definizione dello schema per IndexedDB
interface AppDB extends DBSchema {
  events: { key: string; value: IndexDB<Event> };
  teams: { key: string; value: IndexDB<Team> };
  challenges: { key: string; value: MergeChallenge };
}

@Injectable({
  providedIn: 'root'
})
export class IndexedDbService {
  private db!: IDBPDatabase<AppDB>;

  constructor() {
    this.initDB();
  }

  // Inizializzazione del database
  private async initDB() {
    this.db = await openDB<AppDB>('fv', 1, {
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
      }
    });
  }

  /* ---------------------------------- Event ---------------------------------- */
  public async saveEvent(event: Doc<Event>): Promise<void> {
    if (!this.db) await this.initDB();

    const eventToSave: IndexDB<Event> = { id: event.id, ...event.props };
    await this.db.put('events', eventToSave);
  }

  public async saveEvents(items: Doc<Event>[]): Promise<void> {
    if (!this.db) await this.initDB();

    const tx = this.db.transaction('events', 'readwrite');
    await tx.store.clear();
    const savePromises = items.map((item) => this.saveEvent(item));
    await Promise.all(savePromises);
    await tx.done;
  }

  public async getEvents(): Promise<Doc<Event>[]> {
    if (!this.db) await this.initDB();

    const dbEvents = await this.db.getAll('events');
    dbEvents.sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
    return dbEvents.map(({ id, ...props }) => ({ id, props }));
  }

  /* ---------------------------------- Team ---------------------------------- */
  public async saveTeam(team: Doc<Team>): Promise<void> {
    if (!this.db) await this.initDB();

    const teamToSave: IndexDB<Team> = { id: team.id, ...team.props };
    await this.db.put('teams', teamToSave);
  }

  public async saveTeams(items: Doc<Team>[]): Promise<void> {
    if (!this.db) await this.initDB();

    const tx = this.db.transaction('teams', 'readwrite');
    await tx.store.clear();
    const savePromises = items.map((item) => this.saveTeam(item));
    await Promise.all(savePromises);
    await tx.done;
  }

  public async getTeams(): Promise<Doc<Team>[]> {
    if (!this.db) await this.initDB();

    const dbTeams = await this.db.getAll('teams');
    dbTeams.sort((a, b) => a.eventStartDate.getTime() - b.eventStartDate.getTime());
    return dbTeams.map(({ id, ...props }) => ({ id, props }));
  }

  /* ---------------------------------- Challenge ---------------------------------- */
  public async saveChallenge(challenge: MergeChallenge): Promise<void> {
    if (!this.db) await this.initDB();

    await this.db.put('challenges', challenge);
  }

  public async saveChallenges(items: MergeChallenge[]): Promise<void> {
    if (!this.db) await this.initDB();

    const tx = this.db.transaction('challenges', 'readwrite');
    await tx.store.clear();
    const savePromises = items.map((item) => this.saveChallenge(item));
    await Promise.all(savePromises);
    await tx.done;
  }

  public async getChallenges(): Promise<MergeChallenge[]> {
    if (!this.db) await this.initDB();

    const dbChallenges = await this.db.getAll('challenges');
    dbChallenges.sort((a, b) => a.name.localeCompare(b.name));
    return dbChallenges;
  }
}
