export type Debug = {
  userId: string | null;
  type: DebugType;
  updatedAt: Date;
  message: string;
};

export enum DebugType {
  INFO = 'INFO',
  ERROR = 'ERROR'
}
