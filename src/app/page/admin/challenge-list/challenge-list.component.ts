import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-challenge-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './challenge-list.component.html',
  styleUrls: ['./challenge-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ChallengeListComponent {}
