import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { FvBottomNavigationComponent } from '../../components/fv-bottom-navigation.component';
import { MenuItem } from '../../model/type';
import { faCalendarDays, faGamepad, faGears, faHome } from '@fortawesome/free-solid-svg-icons';
import { User, UserRole } from '../../model/user.model';
import { Doc } from '../../model/firebase';
import { LocalStorageService } from '../../service/local-storage.service';

const KEY_USER = 'USER';

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
  readonly lsService = inject(LocalStorageService);

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
      label: 'Sfide',
      icon: faGamepad,
      path: 'challenges'
    },
    {
      id: 2,
      label: 'Impostazioni',
      icon: faGears,
      path: 'settings'
    }
  ];

  MENU_SCANNER: MenuItem[] = [
    {
      id: 0,
      label: 'Dashboard',
      icon: faHome,
      path: 'dashboard'
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
    const user = this.lsService.getItem<Doc<User>>(KEY_USER);
    if (!user) {
      this.menu.set([]);
      return;
    }

    switch (user.props.role) {
      case UserRole.ADMIN:
        this.menu.set(this.MENU_ADMIN);
        break;
      case UserRole.SCANNER:
        this.menu.set(this.MENU_SCANNER);
        break;
      default:
        this.menu.set(this.MENU_USER);
        break;
    }
  }
}
