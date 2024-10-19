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

export const generateRandomCode = (length: number): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * chars.length);
    result += chars[randomIndex];
  }
  return result;
};
