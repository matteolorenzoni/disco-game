import { computed, Injectable, signal } from '@angular/core';

const LOADER_TIMER = 100;

@Injectable({
  providedIn: 'root'
})
export class HttpService {
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
      return execution;
    } finally {
      // Cancella il timeout e rimuovi l'ID dalla coda indipendentemente dal successo della chiamata
      clearTimeout(timeout);
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
