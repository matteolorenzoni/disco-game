import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class TypeCheckerService {
  public isValidDate(dateString: string): boolean {
    const date = new Date(dateString);

    // Verifica se la data è effettivamente valida e non un'istanza di "Invalid Date"
    if (isNaN(date.getTime())) {
      return false;
    }

    // Verifica che il formato e i componenti della data corrispondano
    const [year, month, day] = [date.getFullYear(), date.getMonth(), date.getDate()];
    const [inputYear, inputMonth, inputDay] = dateString.split('-').map(Number);

    return year === inputYear && month === inputMonth - 1 && day === inputDay;
  }
}
