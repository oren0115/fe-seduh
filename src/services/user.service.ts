import api from '../lib/api';
import type { User, CreateUserData, UpdateUserData } from '@/types/user.types';

export const userService = {
  getAll: () =>
    api.get<User[]>('/auth/users'),
  
  create: (data: CreateUserData) =>
    api.post<User>('/auth/users', data),
  
  update: (id: string, data: UpdateUserData) =>
    api.put<User>(`/auth/users/${id}`, data),
  
  delete: (id: string) =>
    api.delete(`/auth/users/${id}`),
  
  getRoles: () =>
    api.get<Array<{ value: string; label: string }>>('/auth/roles'),
};

