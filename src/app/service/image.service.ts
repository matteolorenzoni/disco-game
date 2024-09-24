import { Injectable, WritableSignal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ImageService {
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
