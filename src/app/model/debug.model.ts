export type Debug = {
  userId: string | null;
  userInfo: string | null;
  type: DebugType;
  updatedAt: Date;
  message: string;
  url: string;
};

export enum DebugType {
  INFO = 'INFO',
  ERROR = 'ERROR'
}
