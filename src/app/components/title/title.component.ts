import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterModule } from '@angular/router';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faAngleRight, faHome } from '@fortawesome/free-solid-svg-icons';

export type TitlePageItem = {
  label: string;
  path: string;
};

@Component({
  selector: 'app-title',
  standalone: true,
  imports: [CommonModule, RouterModule, FaIconComponent],
  templateUrl: './title.component.html',
  styleUrls: ['./title.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TitleComponent {
  /* Icon */
  ICON_HOME = faHome;
  ICON_RIGHT = faAngleRight;

  /* Inputs */
  pages = input.required<TitlePageItem[]>();
}
