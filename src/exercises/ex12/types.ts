export interface Profile {
  id: number;
  name: string;
  avatar: string;
  bio: string;
  email: string;
  skills: string[];
}

export interface Column {
  key: string;
  label: string;
  sortable?: boolean;
}
