import { Injectable, signal } from '@angular/core';

const LOADER_TIMER = 500;

@Injectable({
  providedIn: 'root'
})
export class LoaderService {
  /* Signal per la visibilità del loader */
  isLoaderVisible = signal<boolean>(false);

  /* -------------------- Methods -------------------- */

  // Versione con il timeout
  public async executeWithDelay(toExecute: () => Promise<void>): Promise<void> {
    const timeout = setTimeout(() => this.isLoaderVisible.set(true), LOADER_TIMER);

    try {
      await toExecute();
    } finally {
      clearTimeout(timeout);
      this.isLoaderVisible.set(false);
    }
  }

  // Versione senza timeout
  public async executeImmediate(toExecute: () => Promise<void>): Promise<void> {
    this.isLoaderVisible.set(true);

    try {
      await toExecute();
    } finally {
      this.isLoaderVisible.set(false);
    }
  }
}
