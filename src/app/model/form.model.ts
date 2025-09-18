import { FormControl } from '@angular/forms';
import { ChallengeType } from './challenge.model';
import { ChallengeStatus } from './event-challenge.model';

export type FromMap<T> = {
  [K in keyof T]: FormControl<T[K]>;
};

export type LoginModel = {
  email: string;
  password: string;
};

export type UserModel = {
  name: string;
  lastName: string;
  userName: string;
  birthDate: string | null;
  email: string;
  password: string;
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

export type EventChallengeModel = {
  challengeId: string;
  status: ChallengeStatus;
  maxTimes: number | null;
  startDate: string | null;
  endDate: string | null;
};
