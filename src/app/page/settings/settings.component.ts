import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { faAngleRight, faCircleUser, faHome, faRightFromBracket } from '@fortawesome/free-solid-svg-icons';
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import { TitleComponent } from '../../components/title/title.component';
import { FileManager } from '../../manager/file.manager';
import { Doc } from '../../model/firebase';
import { User, UserRole } from '../../model/user.model';
import { FirebaseService } from '../../service/firebase.service';
import { LoaderService } from '../../service/loader.service';
import { LocalStorageService } from '../../service/local-storage.service';
import { LogService } from '../../service/log.service';
import { UserService } from '../../service/user.service';
import { UserCreateComponent } from '../register/user-create/user-create.component';

export type Tab = {
  id: 'profile' | 'code' | 'esportazione';
  label: string;
};

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, RouterModule, TitleComponent, UserCreateComponent],
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SettingsComponent implements OnInit {
  /* Service */
  private readonly router = inject(Router);
  private readonly firebaseService = inject(FirebaseService);
  private readonly userService = inject(UserService);
  private readonly lsService = inject(LocalStorageService);
  private readonly logService = inject(LogService);
  private readonly loaderService = inject(LoaderService);

  /* Constants */
  TABS: Tab[] = [
    { id: 'profile', label: 'Profilo' },
    { id: 'code', label: 'Codice' }
  ];

  /* Variables */
  activeTab = signal<Tab>(this.TABS[0]);
  user = signal<Doc<User> | undefined>(undefined);

  /* Icon */
  ICON_HOME = faHome;
  ICON_RIGHT = faAngleRight;
  ICON_USER = faCircleUser;
  ICON_LOGOUT = faRightFromBracket;

  /* -------------------- Lifecycle hooks -------------------- */
  ngOnInit(): void {
    this.initIndexDB();
  }

  /* -------------------------- Methods initialization --------------------------  */
  private async initIndexDB() {
    const user = this.lsService.getUser();
    this.user.set(user ?? undefined);

    /* Tab se role === 'ADMIN' */
    if (user?.props.role === UserRole.ADMIN) {
      this.TABS.push({ id: 'esportazione', label: 'Esportazione' });
      pdfMake.vfs = pdfFonts.vfs;
    }
  }

  /* --------------------- Methods: profile --------------------- */
  protected async logout(): Promise<void> {
    await this.loaderService.executeImmediate(async () => {
      await this.firebaseService.logout();
      this.router.navigate(['/login']);
      this.logService.addLogConfirm('Logout completato. Buona giornata!');
    });
  }

  /* --------------------- Methods: esportazione --------------------- */
  protected async exportUsers(fileType: 'pdf' | 'csv'): Promise<void> {
    await this.loaderService.executeImmediate(async () => {
      const users = await this.userService.getUser();
      const usersOrdered = users.sort((a, b) => {
        // Prima ordina per nome
        const nomeComparison = a.props.name.localeCompare(b.props.name);
        if (nomeComparison !== 0) return nomeComparison;

        // Se i nomi sono uguali, ordina per cognome
        return a.props.lastName.localeCompare(b.props.lastName);
      });

      if (fileType === 'pdf') FileManager.createPdfUser(usersOrdered);
      else FileManager.createCsvUser(usersOrdered);
    });
  }

  /* --------------------- Methods: utils --------------------- */
}
