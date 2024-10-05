import { FormControl } from '@angular/forms';
import { ChallengeType } from './challenge.model';

export type FromMap<T> = {
  [K in keyof T]: FormControl<T[K]>;
};

export type LoginModel = {
  email: string;
  password: string;
};

export type UserModel = {
  name: string;
  lastname: string;
  username: string;
  email: string;
  password: string;
  // birthDate: string;
};

export type EventModel = {
  name: string;
  description: string;
  location: string;
  startDate: string;
  endDate: string;
};

export type ChallengeModel = {
  name: string;
  description: string;
  rules: string;
  type: ChallengeType;
  points: number;
  complexity: number;
};

export type NewTeamModel = {
  name: string;
  // description: string;
};

export type FindTeamModel = {
  code: string;
};
