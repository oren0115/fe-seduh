export interface Holiday {
  _id: string;
  date: string;
  name: string;
  type: 'NATIONAL' | 'STORE';
  description?: string;
  isRecurring: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateHolidayData {
  date: string;
  name: string;
  type: 'NATIONAL' | 'STORE';
  description?: string;
  isRecurring?: boolean;
}

export interface UpdateHolidayData {
  date?: string;
  name?: string;
  type?: 'NATIONAL' | 'STORE';
  description?: string;
  isRecurring?: boolean;
}

