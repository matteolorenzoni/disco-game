import { computed, Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LoaderService {
  /* Variables */
  httpRequestsActive = signal<number>(0);
  loader = computed(() => this.httpRequestsActive() > 0);

  public show(): void {
    this.httpRequestsActive.update((val) => val + 1);
    document.body.style.overflow = 'hidden';
    document.body.style.height = '100vh';
    document.body.style.touchAction = 'none';
  }

  public hide(): void {
    this.httpRequestsActive.update((val) => val - 1);

    if (this.httpRequestsActive() <= 0) {
      document.body.style.overflow = 'auto';
      document.body.style.height = 'auto';
      document.body.style.touchAction = 'auto';
    }
  }
}
