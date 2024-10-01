import { IconDefinition } from '@fortawesome/free-solid-svg-icons';

export type MenuItem = {
  id: number;
  label: string;
  icon: IconDefinition;
  path: string;
};
