import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { FirebaseService } from '../../service/firebase.service';
import { UserCreateComponent } from '../user/user-create/user-create.component';
import { HttpService } from '../../service/http.service';

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
  readonly firebaseService = inject(FirebaseService);
  readonly httpService = inject(HttpService);

  /* ------------- Methods ------------- */
  async ngOnInit(): Promise<void> {
    await this.httpService.execute(async () => await this.firebaseService.logout());
  }
}
