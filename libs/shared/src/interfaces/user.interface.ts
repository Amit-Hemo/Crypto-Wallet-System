export interface User {
  id: number;
  email: string;
  username: string;
  password?: string;
}

export interface JwtAuthUser {
  id: number;
  email: string;
}

export interface UserSelectionOptions {
  exposePassword?: boolean;
}
