import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-gdpr',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './privacy-policy.component.html',
  styleUrls: ['./privacy-policy.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PrivacyPolicyComponent {
  /* Services */
  private readonly router = inject(Router);

  protected async goToSignUp() {
    await this.router.navigateByUrl('sign-up');
  }
}
