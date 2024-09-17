import { FormControl } from '@angular/forms';
import { ChallengeStatus } from './challenge.model';

export type FromMap<T> = {
  [K in keyof T]: FormControl<T[K]>;
};

export type LoginModel = {
  email: string;
  password: string;
};

export type SignUpModel = {
  name: string;
  lastname: string;
  username: string;
  birthDate: string;
  email: string;
  password: string;
};

export type EventModel = {
  name: string;
  description: string;

  location: string;
  imageUrl: string | null;
  startDate: string;
  endDate: string;
};

export type ChallengeModel = {
  name: string;
  description: string;
  rules: string;
  points: number;
  complexity: number;
  status: ChallengeStatus;
  startDate: string;
  endDate: string;
};
