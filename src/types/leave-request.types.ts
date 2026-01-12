export interface LeaveRequest {
  _id: string;
  userId: string;
  type: 'SICK' | 'PERMISSION' | 'ANNUAL';
  startDate: string;
  endDate: string;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  attachmentUrl?: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectionReason?: string;
  user?: {
    _id: string;
    name: string;
    email: string;
    role: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateLeaveRequestData {
  type: 'SICK' | 'PERMISSION' | 'ANNUAL';
  startDate: string;
  endDate: string;
  reason: string;
}

export interface UpdateLeaveRequestData {
  status?: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejectionReason?: string;
}

