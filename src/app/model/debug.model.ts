export type Debug = {
  type: DebugType;
  userId: string | null;
  userInfo: string | null;
  url: string;
  messageType: number;
  messageLog: string;
  messageDebug: string;
  stackTrace: string | null;
  device: string;
  browser: string;
  os: string;
  updatedAt: Date;
};

export enum DebugType {
  INFO = 'INFO',
  ERROR = 'ERROR'
}
