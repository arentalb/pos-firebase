import { Injectable } from '@angular/core';
import { AngularFireStorage } from "@angular/fire/compat/storage";
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ImageService {
  constructor(private storage: AngularFireStorage) {}

  downloadAndConvertToBase64(imageUrl: string): Observable<string> {
    return new Observable((observer) => {
      try {
        // Create a reference to the image file
        const imageRef = this.storage.refFromURL(imageUrl);

        // Get the download URL of the image
        imageRef.getDownloadURL().subscribe((downloadUrl) => {
          // Fetch the image as a blob
          this.fetchImageBlob(downloadUrl).subscribe(
            (blob) => {
              // Convert blob to base64
              this.convertBlobToBase64(blob).subscribe(
                (base64Data) => {
                  observer.next(base64Data);
                  observer.complete();
                },
                (error) => {
                  observer.error(error);
                }
              );
            },
            (error) => {
              observer.error(error);
            }
          );
        });
      } catch (error) {
        observer.error(error);
      }
    });
  }

  private fetchImageBlob(url: string): Observable<Blob> {
    return new Observable((observer) => {
      fetch(url)
        .then((response) => response.blob())
        .then((blob) => {
          observer.next(blob);
          observer.complete();
        })
        .catch((error) => {
          observer.error(error);
        });
    });
  }

  private convertBlobToBase64(blob: Blob): Observable<string> {
    return new Observable((observer) => {
      const reader = new FileReader();
      reader.readAsDataURL(blob);

      reader.onloadend = () => {
        const base64Data = reader.result as string;
        observer.next(base64Data.split(',')[1]);
        observer.complete();
      };

      reader.onerror = (error) => {
        observer.error(error);
      };
    });
  }
  fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!file) {
        reject(new Error('No file selected.'));
        return;
      }

      const reader = new FileReader();

      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          // Extract base64 portion from the Data URL
          const base64String = reader.result.split(',')[1];
          resolve(base64String);
        } else {
          reject(new Error('Failed to read file contents.'));
        }
      };

      reader.readAsDataURL(file);
    });
  }
   convertImageToBase64(image: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(image);
    });
  }
   base64ToFile(base64String: string, fileName: string, mimeType: string): File {
    const byteCharacters = atob(base64String);
    const byteNumbers = new Array(byteCharacters.length);

    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }

    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: mimeType });

    // Create a File from the Blob
    const file = new File([blob], fileName, { type: mimeType });

    return file;
  }
}
