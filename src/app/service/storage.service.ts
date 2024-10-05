import { inject, Injectable, WritableSignal } from '@angular/core';
import { deleteObject, getDownloadURL, listAll, ListResult, ref, uploadBytesResumable } from 'firebase/storage';
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
  public async getImageRefsByCollection(collection: string): Promise<ListResult> {
    try {
      // Crea un riferimento alla cartella specificata in Firebase Storage
      const folderRef = ref(this.firebaseService.getStorage(), collection);

      // Recupera tutti i riferimenti delle immagini nella cartella specificata
      return await listAll(folderRef);
    } catch (error) {
      this.logService.addLogError(this.firebaseService.userFirebase()?.uid, error);
      throw error;
    }
  }

  public async saveImage(image: File, collection: string, name: string): Promise<string> {
    try {
      // Crea un riferimento alla cartella specificata in Firebase Storage
      const imageRef = ref(this.firebaseService.getStorage(), `${collection}/${name}.jpg`);

      // Carica la nuova immagine su Firebase Storage
      const snapshot = await uploadBytesResumable(imageRef, image);

      // Ottieni l'URL della nuova immagine caricata
      const downloadURL = await getDownloadURL(snapshot.ref);
      return downloadURL;
    } catch (error) {
      this.logService.addLogError(this.firebaseService.userFirebase()?.uid, error);
      throw error;
    }
  }

  public async updateImage(image: File, collection: string, name: string): Promise<string> {
    try {
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

      // Carica l'immagine selezionata nel file reader e imposta l'anteprima
      reader.onload = (e) => {
        imagePreview.set(e.target?.result);
        imageFile.set(file); // Salva il file dell'immagine selezionata
      };
      reader.readAsDataURL(file); // Legge il file immagine come URL
    }
  }
}
