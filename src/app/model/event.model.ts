export type Event = {
  name: string;
  description: string;
  code: string;
  location: string;
  imageUrl: string;
  startDate: Date;
  endDate: Date;
  teamIds: string[];
  eventChallengeIds: string[];
  isActive: boolean;
  updatedAt: Date;
};
