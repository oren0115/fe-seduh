export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'OWNER' | 'KASIR' | 'BARISTA';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserData {
  name: string;
  email: string;
  password: string;
  role: 'OWNER' | 'KASIR' | 'BARISTA';
}

export interface UpdateUserData {
  name?: string;
  email?: string;
  password?: string;
  role?: 'OWNER' | 'KASIR' | 'BARISTA';
  isActive?: boolean;
}

