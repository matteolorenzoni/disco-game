import { computed, inject, Injectable, signal } from '@angular/core';
import { LogService } from './log.service';
import { LocalStorageService } from './local-storage.service';

const LOADER_TIMER = 500;

@Injectable({
  providedIn: 'root'
})
export class HttpService {
  /* Services */
  readonly logService = inject(LogService);
  readonly lsService = inject(LocalStorageService);

  /* Signals */
  httpRequestsQueue = signal<Set<number>>(new Set());

  /* Computed per la visibilità del loader */
  isLoader = computed(() => this.httpRequestsQueue().size > 0);

  /* -------------------- Methods -------------------- */
  public async execute<T>(toExecute: () => Promise<T>, timer = LOADER_TIMER): Promise<T> {
    /* Genera un ID univoco per la richiesta */
    const requestId = new Date().getTime();

    /* Attiva il timeout che parte solo dopo 'LOADER_TIMER' secondi */
    const timeout = setTimeout(() => this.addRequestToQueue(requestId), timer);

    try {
      const execution = await toExecute();
      clearTimeout(timeout);
      return execution;
    } catch (error) {
      clearTimeout(timeout);
      const user = this.lsService.getUser();
      this.logService.addLogError(user?.id, error);
      throw error;
    } finally {
      // Rimuovi l'ID dalla coda indipendentemente dal successo della chiamata
      // Sarà presente solo se il timer lo aveva precedetemene aggiunto
      this.httpRequestsQueue.update((queue) => {
        queue.delete(requestId);
        return new Set(queue);
      });
    }
  }

  private addRequestToQueue(requestId: number) {
    this.httpRequestsQueue.update((queue) => {
      queue.add(requestId);
      return new Set(queue); // Cosi per il computed
    });
  }
}
