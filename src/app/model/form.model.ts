import { FormControl } from '@angular/forms';

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
