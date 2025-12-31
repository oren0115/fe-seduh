export interface Shift {
  _id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  breakMinutes: number;
  status: 'SCHEDULED' | 'ON_SHIFT' | 'COMPLETED' | 'CANCELLED' | 'ABSENT' | 'LATE' | 'PENDING_APPROVAL';
  notes?: string;
  
  // Check-in/Check-out tracking
  checkInTime?: string;
  checkOutTime?: string;
  actualStartTime?: string;
  actualEndTime?: string;
  
  // Late and overtime tracking
  isLate?: boolean;
  lateMinutes?: number;
  overtimeMinutes?: number;
  overtimeStatus?: 'NONE' | 'AUTO' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';
  overtimeReason?: string;
  
  // Transaction tracking
  totalTransactions?: number;
  totalSales?: number;
  totalCash?: number;
  
  user?: {
    _id: string;
    name: string;
    email: string;
    role: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CheckInResult {
  shift: Shift;
  isLate: boolean;
  lateMinutes: number;
  message: string;
}

export interface CheckOutResult {
  shift: Shift;
  overtimeMinutes: number;
  overtimeStatus: 'NONE' | 'AUTO' | 'PENDING_APPROVAL';
  totalWorkMinutes: number;
  message: string;
}

export interface CreateShiftData {
  userId: string;
  date: string;
  shiftTemplateId?: string;
  startTime: string;
  endTime: string;
  breakMinutes?: number;
  notes?: string;
}

export interface CreateBulkShiftsData {
  userId: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  breakMinutes?: number;
  daysOfWeek?: number[]; // 0 = Sunday, 6 = Saturday
  notes?: string;
}

export interface BulkShiftsResult {
  created: number;
  skipped: number;
  shifts: Shift[];
}

export interface UpdateShiftData {
  date?: string;
  startTime?: string;
  endTime?: string;
  breakMinutes?: number;
  status?: 'SCHEDULED' | 'ON_SHIFT' | 'COMPLETED' | 'CANCELLED' | 'ABSENT' | 'LATE' | 'PENDING_APPROVAL';
  notes?: string;
}

export interface ShiftTemplate {
  _id: string;
  name: string;
  startTime: string;
  endTime: string;
  breakMinutes: number;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateShiftTemplateData {
  name: string;
  startTime: string;
  endTime: string;
  breakMinutes?: number;
  description?: string;
  isActive?: boolean;
}

export interface UpdateShiftTemplateData {
  name?: string;
  startTime?: string;
  endTime?: string;
  breakMinutes?: number;
  description?: string;
  isActive?: boolean;
}

