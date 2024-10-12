import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FvFloatingButtonComponent } from '../../../components/fv-floating-button.component';
import { Router } from '@angular/router';
import { ChallengeService } from '../../../service/challenge.service';
import { Doc } from '../../../model/firebase';
import { Challenge } from '../../../model/challenge.model';
import { FvRatingComponent } from '../../../components/fv-rating.component';
import { TitleComponent } from '../../../components/title/title.component';

@Component({
  selector: 'app-challenge-list',
  standalone: true,
  imports: [CommonModule, TitleComponent, FvRatingComponent, FvFloatingButtonComponent],
  templateUrl: './challenge-list.component.html',
  styleUrls: ['./challenge-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ChallengeListComponent implements OnInit {
  /* Services */
  readonly router = inject(Router);
  readonly challengeService = inject(ChallengeService);

  /* Variables */
  challenges = signal<Doc<Challenge>[]>([]);

  /* -------------------- Lifecycle hooks -------------------- */
  async ngOnInit(): Promise<void> {
    const challenges = await this.challengeService.getChallenges();
    this.challenges.set(challenges);
  }

  /* -------------------- Methods -------------------- */
  protected async updateChallenge(challengeId: string): Promise<void> {
    await this.router.navigateByUrl(`admin/challenges/${challengeId}`);
  }

  protected async executeFloatingButton(): Promise<void> {
    await this.router.navigateByUrl('admin/challenges/new');
  }
}
