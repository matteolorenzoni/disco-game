import { MessageType } from '../service/log.service';

export type Debug = {
  type: DebugType;
  userId: string | null;
  userInfo: string | null;
  url: string;
  messageType: MessageType;
  messageLog: string;
  messageDebug: string;
  stackTrace: string | null;
  device: string;
  browser: string;
  os: string;
  updatedAt: Date;
};

export type DebugDto = {
  [K in keyof Debug]: Debug[K] extends MessageType ? string : Debug[K];
};

export enum DebugType {
  INFO = 'INFO',
  ERROR = 'ERROR'
}
