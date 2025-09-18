import { CommonModule, formatDate, NgOptimizedImage } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faPen, faTrash } from '@fortawesome/free-solid-svg-icons';
import { FvButtonComponent } from '../../../components/fv-button.component';
import { FvFieldComponent } from '../../../components/fv-field.component';
import { Doc } from '../../../model/firebase';
import { FromMap, UserModel } from '../../../model/form.model';
import { User } from '../../../model/user.model';
import { FirebaseService } from '../../../service/firebase.service';
import { LoaderService } from '../../../service/loader.service';
import { LocalStorageService } from '../../../service/local-storage.service';
import { LogService } from '../../../service/log.service';
import { StorageService } from '../../../service/storage.service';
import { TeamService } from '../../../service/team.service';
import { UserService } from '../../../service/user.service';
import { trimFormValues } from '../../../util/utils';

@Component({
  selector: 'app-user-create',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FaIconComponent, FvFieldComponent, FvButtonComponent, NgOptimizedImage],
  templateUrl: './user-create.component.html',
  styleUrls: ['./user-create.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UserCreateComponent implements OnInit {
  /* Services */
  private readonly router = inject(Router);
  protected readonly firebaseService = inject(FirebaseService);
  private readonly storageService = inject(StorageService);
  private readonly userService = inject(UserService);
  private readonly teamService = inject(TeamService);
  private readonly loaderService = inject(LoaderService);
  private readonly lsService = inject(LocalStorageService);
  private readonly logService = inject(LogService);

  /* Variables */
  user = signal<Doc<User> | undefined>(undefined);
  imagePreview = signal<string | ArrayBuffer | null | undefined>(undefined);
  imageFile = signal<File | undefined>(undefined);
  isPolicyAccepted = signal<boolean>(false);

  /* Icons */
  ICON_PEN = faPen;
  ICON_TRASH = faTrash;

  /* Form */
  signUpForm = new FormGroup<FromMap<UserModel>>({
    name: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    lastName: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    userName: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    birthDate: new FormControl(null),
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email]
    }),
    password: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(8)]
    })
  });

  /* ------------- Lifecycle hooks ------------- */
  async ngOnInit(): Promise<void> {
    let user = this.lsService.getUser();
    if (!user) {
      const userId = this.firebaseService.userFirebase()?.uid;
      if (!userId) return;

      user = await this.userService.getUserById(userId);
      this.lsService.setUser(user);
    }

    /* Aggiorno user */
    this.user.set(user);

    /* Aggiorno form */
    this.initForm(user);
  }

  /* -------------------------- Methods initialization --------------------------  */
  private initForm(user: Doc<User>) {
    this.signUpForm.setValue({
      name: user.props.name,
      lastName: user.props.lastName,
      userName: user.props.userName,
      birthDate: user.props.birthDate ? formatDate(user.props.birthDate, 'yyyy-MM-dd', 'it') : null,
      email: user.props.email,
      password: '******'
    });
    this.imagePreview.set(user.props.imageUrl); // Aggiorno immagine
    this.signUpForm.get('email')?.disable(); // Disabilito field email
    this.signUpForm.get('password')?.disable(); // Disabilito field password
  }

  /* ------------------------------- Methods: firebase ------------------------------- */
  protected async addOrUpdateUser(): Promise<void> {
    if (this.signUpForm.invalid) throw new Error('formNotValid', { cause: 'formNotValid' });

    await this.loaderService.executeImmediate(async () => {
      const userId = this.firebaseService.userFirebase()?.uid;
      const userModelForm = trimFormValues(this.signUpForm.getRawValue());
      if (!userId) await this.addUser(userModelForm);
      else await this.updateUser(userId, userModelForm);
    });
  }

  /* ------------------------------- Methods: event ------------------------------- */
  protected onImageChange(event: Event) {
    this.storageService.onImageChange(event, this.imagePreview, this.imageFile);
  }

  protected onImageRemove() {
    this.imagePreview.set(null);
    this.imageFile.set(undefined);
  }

  protected onUpdatePolicyAcceptance(event: Event): void {
    const isChecked = (event.target as HTMLInputElement)?.checked ?? false;
    this.isPolicyAccepted.set(isChecked);
  }

  /* ------------------------------- Methods: util ------------------------------- */
  private async addUser(userModelForm: UserModel): Promise<void> {
    if (!this.isPolicyAccepted()) {
      this.logService.addLogErrorApp('Accetta la privacy policy per procedere');
      return;
    }

    /* Check user name univoco */
    const isNewUserName = await this.userService.getUserByUsername(userModelForm.userName);
    if (isNewUserName) {
      this.logService.addLogErrorApp('Il nome utente scelto è già in uso. Scegli un nome diverso');
      return;
    }

    /* Creo profilo */
    const userCredential = await this.firebaseService.signUp(userModelForm.email, userModelForm.password);

    /* Aggiungo utente immagine */
    let imageUrl: string | null = null;
    if (this.imageFile()) {
      imageUrl = await this.userService.saveImage(this.imageFile()!, userCredential.user.uid);
    }

    /* Aggiungo utente */
    await this.userService.add(userCredential, userModelForm, imageUrl);

    /* Aggiorno local storage */
    const user = await this.userService.getUserById(userCredential.user.uid);
    this.lsService.setUser(user);

    /* Log */
    this.logService.addLogConfirm('Utente registrato');

    /* Redirect */
    await this.router.navigate(['/login']);
  }

  private async updateUser(userId: string, userModelForm: UserModel): Promise<void> {
    const user = this.user();
    if (!user) throw new Error('retry', { cause: 'retry' });

    /* Aggiornamento utente immagine */
    let imageUrl: string | null = null;
    if (this.imageFile()) {
      imageUrl = await this.userService.saveImage(this.imageFile()!, userId);
    } else {
      if (this.imagePreview()) imageUrl = user.props.imageUrl;
      else await this.userService.deleteImage(userId);
    }

    /* Aggiorno le varie squadre (è memorizzato solo username e img) */
    const teams = await this.teamService.getActiveTeamsByUserId(user.id);
    await this.teamService.updateTeamUser(teams, user.id, {
      userName: userModelForm.userName,
      imageUrl
    });

    /* Aggiorna utente */
    await this.userService.update(userId, userModelForm, imageUrl);

    /* Aggiorno local storage */
    const userUpdated: Doc<User> = {
      id: user.id,
      props: {
        ...user.props,
        ...userModelForm,
        birthDate: userModelForm.birthDate ? new Date(userModelForm.birthDate) : null,
        imageUrl
      }
    };
    this.user.set(userUpdated);
    this.lsService.setUser(userUpdated);

    /* Log */
    this.logService.addLogConfirm('Utente aggiornato');
  }
}
