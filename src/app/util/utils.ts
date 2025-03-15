/* eslint-disable @typescript-eslint/no-explicit-any */
import { AbstractControl, ValidatorFn } from '@angular/forms';
import { LogService } from '../service/log.service';

// Definire una funzione di validatore personalizzata per garantire che la data di fine sia dopo la data di inizio
export const endDateValidator: ValidatorFn = (group: AbstractControl): Record<string, boolean> | null => {
  const startDateStr = group.get('startDate')?.value;
  const endDateStr = group.get('endDate')?.value;

  if (!startDateStr || !endDateStr) {
    return null; // Se una delle due date manca, nessun errore
  }

  const startDate = new Date(startDateStr);
  const endDate = new Date(endDateStr);

  return endDate.getTime() < startDate.getTime() ? { endBeforeStart: true } : null;
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

export const trimFormValues = <T extends Record<string, any>>(form: T): T => {
  const trimmedValues: Record<string, any> = {};

  // Itera sulle chiavi dell'oggetto
  Object.keys(form).forEach((key) => {
    const value = form[key];

    if (typeof value === 'string') {
      // Se il valore è una stringa, applica trim
      trimmedValues[key] = value.trim();
    } else if (value && typeof value === 'object' && !Array.isArray(value)) {
      // Se il valore è un oggetto, chiama ricorsivamente la funzione
      trimmedValues[key] = trimFormValues(value);
    } else {
      // Altrimenti, mantieni il valore originale
      trimmedValues[key] = value;
    }
  });

  return trimmedValues as T; // Cast finale a T
};

export const shareTeamCode = (teamCode: string, logService: LogService): void => {
  const obj = {
    title: 'Condividi codice squadra',
    text: `Questo è il codice della mia squadra: ${teamCode}. Ti aspetto!`,
    url: `https://fanta-disco.web.app/user/events?teamCode=${teamCode}`
  };

  // Verifica che la funzione canShare sia disponibile prima di chiamarla
  if (navigator && typeof navigator.canShare === 'function' && navigator.canShare(obj)) {
    navigator.share(obj);
  } else if (navigator && navigator.clipboard) {
    navigator.clipboard.writeText(teamCode);
    logService.addLogConfirm('Codice copiato negli appunti');
  } else {
    logService.addLogErrorApp('Funzione non supportata dal tuo dispositivo');
  }
};
