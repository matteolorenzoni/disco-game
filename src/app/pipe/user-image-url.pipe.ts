import { Pipe, type PipeTransform } from '@angular/core';
import { getDownloadURL, StorageReference } from 'firebase/storage';

@Pipe({
  name: 'user_image_url',
  standalone: true
})
export class UserImageUrlPipe implements PipeTransform {
  async transform(imageId: string, refs: StorageReference[]): Promise<string | null> {
    // Cerca il riferimento all'immagine corrispondente all'ID
    const imageRef = refs.find((ref) => ref.name === `${imageId}.jpg`);

    // Se non trovi l'immagine, restituisci null
    if (!imageRef) return null;

    // Se trovi l'immagine, restituisci l'URL di download
    return await getDownloadURL(imageRef);
  }
}
