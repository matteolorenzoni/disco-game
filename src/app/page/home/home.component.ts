import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
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
export class HomeComponent implements OnInit {
  /* Services */
  readonly router = inject(Router);

  /* Variables */
  menu = signal<MenuItem[]>([]);

  /* Constants */
  MENU_ADMIN: MenuItem[] = [
    {
      id: 0,
      label: 'Eventi',
      icon: faCalendarDays,
      path: 'events'
    },
    {
      id: 1,
      label: 'Impostazioni',
      icon: faGears,
      path: 'settings'
    }
  ];

  MENU_USER: MenuItem[] = [
    {
      id: 0,
      label: 'Eventi',
      icon: faCalendarDays,
      path: 'events'
    },
    {
      id: 1,
      label: 'Impostazioni',
      icon: faGears,
      path: 'settings'
    }
  ];

  /* ----------------- Lifecycle hooks ----------------- */
  ngOnInit(): void {
    const isAdmin = this.router.url.includes('admin');
    this.menu.set(isAdmin ? this.MENU_ADMIN : this.MENU_USER);
  }
}
