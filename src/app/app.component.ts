import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { FirebaseService } from './service/firebase.service';
import { LogService } from './service/log.service';
import { FvToastComponent } from './components/fv-toast.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, FvToastComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  /* Services */
  readonly firebaseService = inject(FirebaseService);
  readonly logService = inject(LogService);

  constructor() {
    this.firebaseService.observeUserState();
  }
}
