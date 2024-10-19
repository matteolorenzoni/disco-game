/* eslint-disable @typescript-eslint/no-explicit-any */
import { EventTeamUserQrCode } from '../model/event-team-user.model';

export const isEventTeamUserQrCode = (obj: any): obj is EventTeamUserQrCode => {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof obj.eventId === 'string' &&
    typeof obj.userId === 'string' &&
    typeof obj.challengeId === 'string' &&
    typeof obj.points === 'number'
  );
};
