import { CommonModule, NgOptimizedImage } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faPen } from '@fortawesome/free-solid-svg-icons';
import { FromMap, UserModel } from '../../../model/form.model';
import { FirebaseService } from '../../../service/firebase.service';
import { StorageService } from '../../../service/storage.service';
import { UserService } from '../../../service/user.service';
import { FvFieldComponent } from '../../../components/fv-field.component';
import { FvButtonComponent } from '../../../components/fv-button.component';
import { LocalStorageService } from '../../../service/local-storage.service';
import { LoaderService } from '../../../service/loader.service';
import { LogService } from '../../../service/log.service';
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
  private readonly loaderService = inject(LoaderService);
  private readonly lsService = inject(LocalStorageService);
  private readonly logService = inject(LogService);

  /* Variables */
  imagePreview = signal<string | ArrayBuffer | null | undefined>(undefined);
  imageFile = signal<File | undefined>(undefined);

  /* Icons */
  ICON_PEN = faPen;

  /* Form */
  signUpForm = new FormGroup<FromMap<UserModel>>({
    name: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    lastName: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    userName: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    // birthDate: new FormControl('', {
    //   nonNullable: true,
    //   validators: [Validators.required]
    // }),
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email]
    }),
    password: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(6)]
    })
  });

  /* ------------- Lifecycle hooks ------------- */
  ngOnInit(): void {
    this.initIndexedDb();
  }

  /* -------------------------- Methods initialization --------------------------  */
  private initIndexedDb() {
    const lsUser = this.lsService.getUser();
    if (lsUser) {
      this.signUpForm.setValue({
        name: lsUser.props.name,
        lastName: lsUser.props.lastName,
        userName: lsUser.props.userName,
        email: lsUser.props.email,
        password: '******'
      });
      this.imagePreview.set(lsUser.props.imageUrl); // Aggiorno immagine
      this.signUpForm.get('email')?.disable(); // Disabilito field email
      this.signUpForm.get('password')?.disable(); // Disabilito field password
    }
  }

  /* ------------------------------- Methods: firebase ------------------------------- */
  protected async addOrUpdateUser(): Promise<void> {
    if (this.signUpForm.invalid) throw new Error('formNotValid', { cause: 'formNotValid' });

    await this.loaderService.executeImmediate(async () => {
      const userId = this.firebaseService.userFirebase()?.uid;
      const userModelForm = trimFormValues(this.signUpForm.getRawValue());
      if (!userId) await this.addUser(userModelForm);
      else await this.updateUser(userId, userModelForm);

      this.signUpForm.reset();
    });
  }

  /* ------------------------------- Methods: event ------------------------------- */
  protected onImageChange(event: Event) {
    this.storageService.onImageChange(event, this.imagePreview, this.imageFile);
  }

  /* ------------------------------- Methods: util ------------------------------- */
  private async addUser(userModelForm: UserModel): Promise<void> {
    /* Creazione utente */
    const userCredential = await this.firebaseService.signUp(userModelForm.email, userModelForm.password);

    /* Creazione utente immagine */
    let imageUrl: string | null = null;
    if (this.imageFile()) {
      imageUrl = await this.userService.addUserImage(this.imageFile()!, userCredential.user.uid);
    }

    /* Aggiunta utente a DB */
    await this.userService.addUser(userCredential.user.uid, userModelForm, imageUrl);

    /* Log */
    this.logService.addLogConfirm('Utente registrato');

    /* Redirect */
    await this.router.navigate(['/login']);
  }

  private async updateUser(userId: string, userModelForm: UserModel): Promise<void> {
    /* Aggiornamento utente immagine */
    let imageUrl: string | null | undefined;
    if (this.imageFile()) {
      imageUrl = await this.userService.updateUserImage(this.imageFile()!, userId);
    }

    /* Creazione utente */
    await this.userService.updateUser(userId, userModelForm, imageUrl);

    /* Aggiorno local storage */
    const lsUser = this.lsService.getUser();
    if (lsUser) {
      lsUser.props = { ...lsUser.props, ...userModelForm };
      if (this.imageFile()) lsUser.props.imageUrl = imageUrl ?? null;
      this.lsService.setUser(lsUser);
    }

    /* Log */
    this.logService.addLogConfirm('Utente aggiornato');
  }
}
