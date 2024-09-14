import { AbstractControl, ValidatorFn } from '@angular/forms';

// Definire una funzione di validatore personalizzata per garantire che la data di fine sia dopo la data di inizio
export const endDateValidator: ValidatorFn = (group: AbstractControl): Record<string, boolean> | null => {
  const startDateStr = group.get('startDate')?.value;
  const endDateStr = group.get('endDate')?.value;

  if (!startDateStr || !endDateStr) {
    return null; // Se una delle due date manca, nessun errore
  }

  const startDate = new Date(startDateStr);
  const endDate = new Date(endDateStr);

  return endDate < startDate ? { endBeforeStart: true } : null;
};
