import { computed, inject, Injectable, signal } from '@angular/core';
import { LogService } from './log.service';
import { FirebaseService } from './firebase.service';

const LOADER_TIMER = 400;

@Injectable({
  providedIn: 'root'
})
export class HttpService {
  /* Services */
  readonly firebaseService = inject(FirebaseService);
  readonly logService = inject(LogService);

  /* Variables */
  httpRequestsActive = signal<number>(0);
  isLoader = computed(() => this.httpRequestsActive() > 0);

  /* -------------------- Methods -------------------- */
  public async execute<T>(toExecute: () => Promise<T>): Promise<T> {
    let isLoaderActive = true;
    const timeout = setTimeout(() => {
      isLoaderActive = true;
      this.httpRequestsActive.update((val) => val + 1);
    }, LOADER_TIMER);

    try {
      const execution = await toExecute();
      this.hideLoader(isLoaderActive, timeout);
      return execution;
    } catch (error) {
      this.hideLoader(isLoaderActive, timeout);
      this.logService.addLogError(this.firebaseService.userFirebase()?.uid, error);
      throw error;
    }
  }

  /* -------------------- Utils -------------------- */
  public updateHttpCount(count: 1 | -1) {
    this.httpRequestsActive.update((val) => val + count);
  }

  private hideLoader(isLoaderActive: boolean, timeout: ReturnType<typeof setTimeout>): void {
    if (isLoaderActive) {
      clearTimeout(timeout);
      this.httpRequestsActive.update((val) => val - 1);
    }
  }
}
