import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { FirebaseService } from '../../../service/firebase.service';
import { UserCreateComponent } from '../user-create/user-create.component';

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
  private readonly firebaseService = inject(FirebaseService);

  /* ------------- Methods ------------- */
  async ngOnInit(): Promise<void> {
    await this.firebaseService.logout();
  }
}
