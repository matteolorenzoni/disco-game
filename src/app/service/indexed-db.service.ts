import { Injectable } from '@angular/core';
import { openDB, IDBPDatabase, DBSchema } from 'idb';
import { Event } from '../model/event.model';
import { Doc, IndexDB } from '../model/firebase';
import { Team } from '../model/team.model';

// Definizione dello schema per IndexedDB
interface AppDB extends DBSchema {
  'user-events': { key: string; value: IndexDB<Event> };
  'user-teams': { key: string; value: IndexDB<Team> };
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
        if (!db.objectStoreNames.contains('user-events')) {
          db.createObjectStore('user-events', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('user-teams')) {
          db.createObjectStore('user-teams', { keyPath: 'id' });
        }
      }
    });
  }

  /* ---------------------------------- Event ---------------------------------- */
  public async saveEvent(event: Doc<Event>): Promise<void> {
    if (!this.db) await this.initDB();

    const eventToSave: IndexDB<Event> = { id: event.id, ...event.props };
    await this.db.put('user-events', eventToSave);
  }

  public async saveEvents(items: Doc<Event>[]): Promise<void> {
    if (!this.db) await this.initDB();

    const tx = this.db.transaction('user-events', 'readwrite'); // Inizializza una transazione
    await tx.store.clear();
    const savePromises = items.map((item) => this.saveEvent(item));
    await Promise.all(savePromises);
    await tx.done;
  }

  public async getEvents(): Promise<Doc<Event>[]> {
    if (!this.db) await this.initDB();

    const dbEvents = await this.db.getAll('user-events');
    return dbEvents.map(({ id, ...props }) => ({ id, props }));
  }

  /* ---------------------------------- Team ---------------------------------- */
  public async saveTeam(team: Doc<Team>): Promise<void> {
    if (!this.db) await this.initDB();

    const teamToSave: IndexDB<Team> = { id: team.id, ...team.props };
    await this.db.put('user-teams', teamToSave);
  }

  public async saveTeams(items: Doc<Team>[]): Promise<void> {
    if (!this.db) await this.initDB();

    const tx = this.db.transaction('user-teams', 'readwrite'); // Inizializza una transazione
    await tx.store.clear();
    const savePromises = items.map((item) => this.saveTeam(item));
    await Promise.all(savePromises);
    await tx.done;
  }

  public async getTeams(): Promise<Doc<Team>[]> {
    if (!this.db) await this.initDB();

    const dbTeams = await this.db.getAll('user-teams');
    return dbTeams.map(({ id, ...props }) => ({ id, props }));
  }
}
