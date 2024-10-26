// Tipo User
export interface Doc<T> {
  id: string;
  props: T;
}

export type IndexDB<T> = { id: string } & T;
