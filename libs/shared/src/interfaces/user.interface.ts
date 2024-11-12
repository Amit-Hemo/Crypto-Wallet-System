export interface User {
  id: number;
  email: string;
  username: string;
  password?: string;
}

export interface UserSelectionOptions {
  exposePassword?: boolean;
}
