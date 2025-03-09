export type User = {
  name: string;
  lastName: string;
  userName: string;
  email: string;
  registeredAt: Date;
  birthDate: Date;
  imageUrl: string | null;
  role: UserRole;
  code: string;
  participations: UserParticipation[];
  isActive: boolean;
  updatedAt: Date;
};

export type UserParticipation = { eventId: string; teamId: string };

export enum UserRole {
  ADMIN = 'ADMIN',
  SCANNER = 'SCANNER',
  USER = 'USER'
}
