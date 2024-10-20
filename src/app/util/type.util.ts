/* eslint-disable @typescript-eslint/no-explicit-any */

import { Qrcode } from '../model/event-challenge.model';

export const isQrcode = (obj: any): obj is Qrcode => {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof obj.eventId === 'string' &&
    typeof obj.teamId === 'string' &&
    typeof obj.userId === 'string' &&
    typeof obj.challengeId === 'string' &&
    typeof obj.points === 'number'
  );
};

export const isEqualQrcode = (qrA: Qrcode, qrB: Qrcode | undefined): boolean => {
  if (!qrB) return false;
  return (
    qrA.eventId === qrB.eventId &&
    qrA.teamId === qrB.teamId &&
    qrA.userId === qrB.userId &&
    qrA.challengeId === qrB.challengeId &&
    qrA.points === qrB.points
  );
};
