export type Team = {
  name: string;
  code: string;
  leaderId: string;
  status: TeamStatus;
  totalPoints: number;
  eventId: string;
  eventStartDate: Date;
  userIds: string[];
  users: TeamUser[];
  isActive: boolean;
  updatedAt: Date;
};

export type TeamUser = {
  id: string;
  userName: string;
  imageUrl: string | null;
  registeredAt: Date | undefined;
  challenges: TeamUserChallenge[];
};

export type TeamUserChallenge = {
  id: string;
  timestamps: Date[];
  totalPoints: number;
};

export enum TeamStatus {
  ACTIVE = 'ACTIVE',
  BANNED = 'BANNED',
  SUSPENDED = 'SUSPENDED'
}
