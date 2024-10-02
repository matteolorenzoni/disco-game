import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { FvBottomNavigationComponent } from '../../components/fv-bottom-navigation.component';
import { MenuItem } from '../../model/type';
import { faCalendarDays, faGears } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterOutlet, FvBottomNavigationComponent],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HomeComponent {
  /* Constants */
  MENU_USER: MenuItem[] = [
    {
      id: 0,
      label: 'Eventi',
      icon: faCalendarDays,
      path: 'events'
    },
    {
      id: 0,
      label: 'Impostazioni',
      icon: faGears,
      path: 'settings'
    }
  ];
}
