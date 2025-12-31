import { useState, useEffect, useCallback } from 'react';
import { leaveRequestService, LeaveRequest } from '@/lib/api-services';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, Clock, Filter, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatDate, cn } from '@/lib/utils';

export function LeaveApproval() {
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLeave, setSelectedLeave] = useState<LeaveRequest | null>(null);
  const [openDetailDialog, setOpenDetailDialog] = useState(false);
  const [openRejectDialog, setOpenRejectDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const { toast } = useToast();

  // Filters
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('');

  const loadLeaves = useCallback(async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (filterStatus) params.status = filterStatus;
      if (filterType) params.type = filterType;

      const response = await leaveRequestService.getAll(params);
      setLeaves(response.data);
    } catch (error) {
      console.error('Failed to load leave requests:', error);
      toast({
        title: 'Error',
        description: 'Failed to load leave requests',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [filterStatus, filterType, toast]);

  useEffect(() => {
    loadLeaves();
  }, [loadLeaves]);

  const handleApprove = async (id: string) => {
    try {
      await leaveRequestService.approve(id);
      toast({
        title: 'Success',
        description: 'Leave request approved',
      });
      loadLeaves();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      toast({
        title: 'Error',
        description: err.response?.data?.error || 'Failed to approve leave',
        variant: 'destructive',
      });
    }
  };

  const handleReject = async () => {
    if (!selectedLeave || !rejectionReason.trim()) {
      toast({
        title: 'Error',
        description: 'Rejection reason is required',
        variant: 'destructive',
      });
      return;
    }

    try {
      await leaveRequestService.reject(selectedLeave._id, rejectionReason);
      setOpenRejectDialog(false);
      setSelectedLeave(null);
      setRejectionReason('');
      toast({
        title: 'Success',
        description: 'Leave request rejected',
      });
      loadLeaves();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      toast({
        title: 'Error',
        description: err.response?.data?.error || 'Failed to reject leave',
        variant: 'destructive',
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      PENDING: {
        label: 'Pending',
        icon: Clock,
        className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
      },
      APPROVED: {
        label: 'Approved',
        icon: CheckCircle2,
        className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
      },
      REJECTED: {
        label: 'Rejected',
        icon: XCircle,
        className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
      },
    };
    const statusInfo = statusMap[status as keyof typeof statusMap] || statusMap.PENDING;
    const Icon = statusInfo.icon;
    return (
      <Badge className={cn('flex items-center gap-1', statusInfo.className)}>
        <Icon className="h-3 w-3" />
        {statusInfo.label}
      </Badge>
    );
  };

  const getTypeBadge = (type: string) => {
    const typeMap = {
      SICK: { label: 'Sick', className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' },
      PERMISSION: { label: 'Permission', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
      ANNUAL: { label: 'Annual', className: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' },
    };
    const typeInfo = typeMap[type as keyof typeof typeMap] || typeMap.PERMISSION;
    return (
      <Badge className={typeInfo.className}>{typeInfo.label}</Badge>
    );
  };

  const handleViewDetails = (leave: LeaveRequest) => {
    setSelectedLeave(leave);
    setOpenDetailDialog(true);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Leave Approval</h2>
        <p className="text-muted-foreground">
          Review and approve leave requests from cashiers
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            <CardTitle>Filters</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="filter-status">Status</Label>
              <Select value={filterStatus || undefined} onValueChange={setFilterStatus}>
                <SelectTrigger id="filter-status">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="APPROVED">Approved</SelectItem>
                  <SelectItem value="REJECTED">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="filter-type">Type</Label>
              <Select value={filterType || undefined} onValueChange={setFilterType}>
                <SelectTrigger id="filter-type">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SICK">Sick</SelectItem>
                  <SelectItem value="PERMISSION">Permission</SelectItem>
                  <SelectItem value="ANNUAL">Annual</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Leave Requests Table */}
      <Card>
        <CardHeader>
          <CardTitle>Leave Requests</CardTitle>
          <CardDescription>
            {leaves.filter(l => l.status === 'PENDING').length} pending requests
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Loading leave requests...</p>
            </div>
          ) : leaves.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">
                No leave requests found.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Date Range</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leaves.map((leave) => (
                    <TableRow key={leave._id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">
                            {leave.user?.name || 'Unknown'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{getTypeBadge(leave.type)}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{formatDate(leave.startDate)}</div>
                          <div className="text-muted-foreground">to</div>
                          <div>{formatDate(leave.endDate)}</div>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(leave.status)}</TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground line-clamp-1">
                          {leave.reason}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        {leave.status === 'PENDING' ? (
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewDetails(leave)}
                            >
                              View
                            </Button>
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => handleApprove(leave._id)}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <CheckCircle2 className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => {
                                setSelectedLeave(leave);
                                setOpenRejectDialog(true);
                              }}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                          </div>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewDetails(leave)}
                          >
                            View Details
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={openDetailDialog} onOpenChange={setOpenDetailDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Leave Request Details</DialogTitle>
            <DialogDescription>
              View complete information about this leave request
            </DialogDescription>
          </DialogHeader>
          {selectedLeave && (
            <div className="space-y-4 py-4">
              <div>
                <Label className="text-muted-foreground">Employee</Label>
                <p className="font-medium">{selectedLeave.user?.name || 'Unknown'}</p>
                <p className="text-sm text-muted-foreground">{selectedLeave.user?.email}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Type</Label>
                <div className="mt-1">{getTypeBadge(selectedLeave.type)}</div>
              </div>
              <div>
                <Label className="text-muted-foreground">Date Range</Label>
                <p className="font-medium">
                  {formatDate(selectedLeave.startDate)} - {formatDate(selectedLeave.endDate)}
                </p>
              </div>
              <div>
                <Label className="text-muted-foreground">Reason</Label>
                <p className="text-sm">{selectedLeave.reason}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Status</Label>
                <div className="mt-1">{getStatusBadge(selectedLeave.status)}</div>
              </div>
              {selectedLeave.rejectionReason && (
                <div>
                  <Label className="text-muted-foreground">Rejection Reason</Label>
                  <p className="text-sm text-destructive">{selectedLeave.rejectionReason}</p>
                </div>
              )}
              {selectedLeave.attachmentUrl && (
                <div>
                  <Label className="text-muted-foreground">Attachment</Label>
                  <a
                    href={selectedLeave.attachmentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline"
                  >
                    View Attachment
                  </a>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenDetailDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={openRejectDialog} onOpenChange={setOpenRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Leave Request</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this leave request
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="rejection-reason">Rejection Reason *</Label>
              <Input
                id="rejection-reason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Enter reason for rejection"
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setOpenRejectDialog(false);
                setRejectionReason('');
                setSelectedLeave(null);
              }}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleReject}>
              Reject Leave
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

