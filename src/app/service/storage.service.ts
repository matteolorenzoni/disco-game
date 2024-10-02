import { inject, Injectable, WritableSignal } from '@angular/core';
import { deleteObject, getDownloadURL, ref, uploadBytesResumable } from 'firebase/storage';
import { LogService } from './log.service';
import { FirebaseService } from './firebase.service';
import { environment } from '../../environments/environment.development';

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  /* Variables */
  readonly firebaseService = inject(FirebaseService);
  readonly logService = inject(LogService);

  /* --------------------------- Method Firebase --------------------------- */
  public async saveImage(image: File, collectionKey: 'USERS' | 'EVENTS', name: string): Promise<string> {
    try {
      const collection = environment.collection[collectionKey];
      const imageType = image.type.split('/')[1] || 'jpg';
      const imageRef = ref(this.firebaseService.getStorage(), `${collection}/${name}.${imageType}`);

      /* Carica la nuova immagine */
      const snapshot = await uploadBytesResumable(imageRef, image);

      /* Ottieni l'URL della nuova immagine */
      const downloadURL = await getDownloadURL(snapshot.ref);
      return downloadURL;
    } catch (error) {
      this.logService.addLogError(this.firebaseService.userFirebase()?.uid, error);
      throw error;
    }
  }

  public async updateImage(image: File, collectionKey: 'USERS' | 'EVENTS', name: string): Promise<string> {
    try {
      const collection = environment.collection[collectionKey];
      const imageType = image.type.split('/')[1] || 'jpg';
      const imageRef = ref(this.firebaseService.getStorage(), `${collection}/${name}.${imageType}`);

      /* Cerca se esiste già un'immagine */
      try {
        const existingImageUrl = await getDownloadURL(imageRef);
        if (existingImageUrl) await deleteObject(imageRef);
      } catch {
        // Se l'immagine non esiste, non facciamo nulla (l'errore è atteso)
      }

      /* Carica la nuova immagine */
      const snapshot = await uploadBytesResumable(imageRef, image);

      /* Ottieni l'URL della nuova immagine */
      const downloadURL = await getDownloadURL(snapshot.ref);
      return downloadURL;
    } catch (error) {
      this.logService.addLogError(this.firebaseService.userFirebase()?.uid, error);
      throw error;
    }
  }

  /* --------------------------- Method Firebase --------------------------- */
  public onImageChange(
    event: Event,
    imagePreview: WritableSignal<string | ArrayBuffer | null | undefined>,
    imageFile: WritableSignal<File | undefined>
  ): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        imagePreview.set(e.target?.result);
        imageFile.set(file);
      };
      reader.readAsDataURL(file);
    }
  }
}
