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

export const generateUniqueCode = async <T>(
  length: number,
  attempts: number,
  checkUserExistence: (code: string) => Promise<T | null>
): Promise<string> => {
  if (attempts <= 0) {
    throw new Error('Tentativo di creazione di codice univoco non riuscito, chiudere app e riprovare');
  }

  // Genera un codice casuale
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * chars.length);
    result += chars[randomIndex];
  }

  // Controlla se il codice esiste già
  const existingUser = await checkUserExistence(result);

  // Codice univoco trovato
  if (existingUser === null) {
    return result;
  }

  // Riprova con un numero di tentativi decrescente
  return generateUniqueCode(length, attempts - 1, checkUserExistence);
};
