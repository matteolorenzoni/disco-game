/* Check type */
export type HasIsActive<T> = T extends { isActive: boolean } ? true : false;

/* Type */
export interface Doc<T> {
  id: string;
  props: T;
}

export type IndexDB<T> = {
  id: string;
} & T;
