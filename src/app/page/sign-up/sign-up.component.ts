import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FirebaseService } from '../../service/firebase.service';
import { UserCreateComponent } from '../user/user-create/user-create.component';

@Component({
  selector: 'app-sign-up',
  standalone: true,
  imports: [CommonModule, UserCreateComponent],
  templateUrl: './sign-up.component.html',
  styleUrls: ['./sign-up.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SignUpComponent implements OnInit {
  /* Services */
  readonly router = inject(Router);
  readonly firebaseService = inject(FirebaseService);

  /* ------------- Methods ------------- */
  async ngOnInit(): Promise<void> {
    /* Se non sono nella pagina di modifica profilo, faccio solo il logout */
    if (!this.router.url.includes('settings/profile')) {
      this.firebaseService.logout(false);
      return;
    }
  }
}
