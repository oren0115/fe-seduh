export interface Attendance {
  _id: string;
  userId: {
    _id: string;
    name: string;
    email: string;
    role: string;
  };
  date: string;
  clockIn: string;
  clockOut?: string;
  breakMinutes: number;
  totalMinutes?: number;
  overtimeMinutes?: number;
  status: 'ON_SHIFT' | 'COMPLETED';
  source: 'ONLINE' | 'OFFLINE_SYNC';
  createdAt: string;
  updatedAt: string;
}

export interface AttendanceSummary {
  userId: string;
  user: {
    _id: string;
    name: string;
    email: string;
    role: string;
  };
  totalDays: number;
  totalMinutes: number;
  totalOvertimeMinutes: number;
  totalHours: number;
  totalOvertimeHours: number;
}

