import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { FirebaseService } from '../../service/firebase.service';
import { UserService } from '../../service/user.service';
import { FromMap, SignUpModel } from '../../model/form.model';
@Component({
  selector: 'app-sign-up',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './sign-up.component.html',
  styleUrls: ['./sign-up.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SignUpComponent implements OnInit {
  /* Services */
  readonly router = inject(Router);
  readonly firebaseService = inject(FirebaseService);
  readonly userService = inject(UserService);

  /* Variables */
  imagePreview = signal<string | ArrayBuffer | null | undefined>(undefined);
  imageFile = signal<File | undefined>(undefined);

  /* Form */
  signUpForm = new FormGroup<FromMap<SignUpModel>>({
    name: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    lastname: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    username: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(6)]
    }),
    birthDate: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required]
    }),
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email]
    }),
    password: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(6)]
    })
  });

  /* ------------- Methods ------------- */
  ngOnInit(): void {
    this.firebaseService.logout(false);
  }

  /* ------------- Methods ------------- */
  protected async signUp(): Promise<void> {
    /* Creazione utente */
    const userCredential = await this.firebaseService.signUp(this.signUpForm.getRawValue());

    /* Aggiunta image a storage */
    let imageUrl: string | null = null;
    if (this.imageFile()) {
      imageUrl = await this.firebaseService.saveImage(this.imageFile()!, userCredential.user.uid);
    }

    /* Aggiunta utente a DB */
    await this.userService.addUser(userCredential.user.uid, { ...this.signUpForm.getRawValue() }, imageUrl);
    await this.router.navigate(['/login']);
  }

  protected onImageChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        this.imagePreview.set(e.target?.result);
        this.imageFile.set(file);
      };
      reader.readAsDataURL(file);
    }
  }
}
