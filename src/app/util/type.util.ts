/* eslint-disable @typescript-eslint/no-explicit-any */

import { Qrcode } from '../model/event-challenge.model';

export const dateYesterday = (): Date => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - 1);
  return date;
};

export const isQrcode = (obj: any): obj is Qrcode => {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof obj.teamId === 'string' &&
    typeof obj.userId === 'string' &&
    typeof obj.challengeId === 'string' &&
    typeof obj.points === 'number'
  );
};

export const isSameQrcode = (oldQrcode: Qrcode | undefined, newQrcode: Qrcode): boolean => {
  if (!oldQrcode) return false;
  return (
    oldQrcode.teamId === newQrcode.teamId &&
    oldQrcode.userId === newQrcode.userId &&
    oldQrcode.challengeId === newQrcode.challengeId &&
    oldQrcode.points === newQrcode.points
  );
};
