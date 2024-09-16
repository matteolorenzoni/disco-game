import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-challenge-create',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './challenge-create.component.html',
  styleUrls: ['./challenge-create.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ChallengeCreateComponent {}
