import { FvHeaderMenuComponent } from './../../components/fv-header-menu.component';
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FvSidebarComponent } from '../../components/fv-sidebar.component';
import { RouterOutlet } from '@angular/router';
import { faCalendarDays, faHouse, faRankingStar, IconDefinition } from '@fortawesome/free-solid-svg-icons';
import { sideMenuAnimation } from '../../animation/animations';

export type SideMenuItem = {
  label: string;
  icon: IconDefinition;
  path: string;
};

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterOutlet, FvHeaderMenuComponent, FvSidebarComponent],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  animations: [sideMenuAnimation],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HomeComponent {
  /* Variables */
  sidebarIsOpen = signal<boolean>(false);

  /* Constants */
  SIDE_MENU = [
    { label: 'Dashboard', icon: faHouse, path: '/user/dashboard' },
    { label: 'Eventi', icon: faCalendarDays, path: '/user/events' },
    { label: 'Classifiche', icon: faRankingStar, path: '/user/ranking' }
  ];

  SIDE_MENU_ADMIN = [];

  /* ------------------- Methods ------------------- */
  protected toggleSidebar(event: Event, isOpen: boolean): void {
    this.sidebarIsOpen.set(isOpen);
    event.stopPropagation();
  }
}
