import { inject, Injectable, WritableSignal } from '@angular/core';
import { deleteObject, getDownloadURL, ref, uploadBytesResumable } from 'firebase/storage';
import { LogService } from './log.service';
import { FirebaseService } from './firebase.service';

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  /* Services */
  readonly firebaseService = inject(FirebaseService);
  readonly logService = inject(LogService);

  /* --------------------------- Method Firebase --------------------------- */
  public async saveImage(image: File, collection: string, name: string): Promise<string> {
    // Crea un riferimento alla cartella specificata in Firebase Storage
    const imageRef = ref(this.firebaseService.getStorage(), `${collection}/${name}.jpg`);

    // Carica la nuova immagine su Firebase Storage
    const snapshot = await uploadBytesResumable(imageRef, image);

    // Ottieni l'URL della nuova immagine caricata
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
  }

  public async updateImage(image: File, collection: string, name: string): Promise<string> {
    // Crea un riferimento alla cartella specificata in Firebase Storage
    const imageRef = ref(this.firebaseService.getStorage(), `${collection}/${name}.jpg`);

    // Verifica se esiste già un'immagine con lo stesso nome e la elimina
    try {
      const existingImageUrl = await getDownloadURL(imageRef);
      if (existingImageUrl) await deleteObject(imageRef);
    } catch {
      // Ignora l'errore se l'immagine non esiste (comportamento atteso)
    }

    // Carica la nuova immagine su Firebase Storage
    const snapshot = await uploadBytesResumable(imageRef, image);

    // Ottieni l'URL della nuova immagine caricata
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
  }

  public async deleteImage(collection: string, name: string): Promise<void> {
    // Crea un riferimento alla cartella specificata in Firebase Storage
    const imageRef = ref(this.firebaseService.getStorage(), `${collection}/${name}.jpg`);

    // Elimina immagine
    await deleteObject(imageRef);
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

      // Carica l'immagine selezionata nel file reader e imposta l'anteprima
      reader.onload = (e) => {
        imagePreview.set(e.target?.result);
        imageFile.set(file); // Salva il file dell'immagine selezionata
      };
      reader.readAsDataURL(file); // Legge il file immagine come URL
    }
  }
}
