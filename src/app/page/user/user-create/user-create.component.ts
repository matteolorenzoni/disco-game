import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faPen } from '@fortawesome/free-solid-svg-icons';
import { FromMap, UserModel } from '../../../model/form.model';
import { FirebaseService } from '../../../service/firebase.service';
import { StorageService } from '../../../service/storage.service';
import { UserService } from '../../../service/user.service';
import { environment } from '../../../../environments/environment.development';
import { FvFieldComponent } from '../../../components/fv-field.component';
import { FvButtonComponent } from '../../../components/fv-button.component';

const COL_USERS = environment.collection.USERS;

@Component({
  selector: 'app-user-create',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FaIconComponent, FvFieldComponent, FvButtonComponent],
  templateUrl: './user-create.component.html',
  styleUrls: ['./user-create.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UserCreateComponent implements OnInit {
  /* Services */
  readonly router = inject(Router);
  readonly firebaseService = inject(FirebaseService);
  readonly storageService = inject(StorageService);
  readonly userService = inject(UserService);

  /* Variables */
  imagePreview = signal<string | ArrayBuffer | null | undefined>(undefined);
  imageFile = signal<File | undefined>(undefined);

  /* Icons */
  ICON_PEN = faPen;

  /* Form */
  signUpForm = new FormGroup<FromMap<UserModel>>({
    name: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    lastName: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    userName: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(6)]
    }),
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
  async ngOnInit(): Promise<void> {
    const user = this.userService.user();
    if (user) {
      this.signUpForm.setValue({
        name: user.props.name,
        lastName: user.props.lastName,
        userName: user.props.userName,
        email: user.props.email,
        password: '******'
      });
      this.imagePreview.set(user.props.imageUrl); // Aggiorno immagine
      this.signUpForm.get('email')?.disable(); // Disabilito field email
      this.signUpForm.get('password')?.disable(); // Disabilito field password
    }
  }

  /* ------------- Methods ------------- */
  protected async addOrUpdateUser(): Promise<void> {
    const user = this.userService.user();
    const userModelForm = this.signUpForm.getRawValue();
    if (user) await this.updateUser(user.id, userModelForm);
    else await this.addUser(userModelForm);
  }

  private async addUser(userModelForm: UserModel): Promise<void> {
    /* Controllo userName univoco */
    const checkUsername = await this.userService.checkUniqUsername(userModelForm.userName);
    if (!checkUsername) return;

    /* Creazione utente */
    const userCredential = await this.firebaseService.signUp(userModelForm.email, userModelForm.password);

    /* Creazione utente immagine */
    let imageUrl: string | null = null;
    if (this.imageFile()) {
      imageUrl = await this.storageService.saveImage(this.imageFile()!, COL_USERS, userCredential.user.uid);
    }

    /* Aggiunta utente a DB */
    await this.userService.addUserById(userCredential.user.uid, userModelForm, imageUrl);
    await this.router.navigate(['/login']);
  }

  private async updateUser(userId: string, userModelForm: UserModel): Promise<void> {
    /* Aggiornamento utente immagine */
    let imageUrl: string | null | undefined;
    if (this.imageFile()) {
      imageUrl = await this.storageService.updateImage(this.imageFile()!, COL_USERS, userId);
    }

    /* Creazione utente */
    await this.userService.updateUser(userId, userModelForm, imageUrl);
  }
}
