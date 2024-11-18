export type Event = {
  name: string;
  description: string;
  code: string;
  location: string;
  imageUrl: string | null;
  startDate: Date;
  endDate: Date;
  teamIds: string[];
  isActive: boolean;
  updatedAt: Date;
};
