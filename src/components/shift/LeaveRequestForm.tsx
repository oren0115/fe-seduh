import { useState, useEffect, useCallback } from 'react';
import { leaveRequestService, LeaveRequest, CreateLeaveRequestData } from '@/lib/api-services';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Clock, CheckCircle2, XCircle, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatDate, cn } from '@/lib/utils';

export function LeaveRequestForm() {
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState<CreateLeaveRequestData>({
    type: 'PERMISSION',
    startDate: '',
    endDate: '',
    reason: '',
    attachmentUrl: '',
  });

  const loadLeaves = useCallback(async () => {
    try {
      setLoading(true);
      const response = await leaveRequestService.getMy();
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
  }, [toast]);

  useEffect(() => {
    loadLeaves();
  }, [loadLeaves]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await leaveRequestService.create(formData);
      toast({
        title: 'Success',
        description: 'Leave request submitted successfully',
      });
      setFormData({
        type: 'PERMISSION',
        startDate: '',
        endDate: '',
        reason: '',
        attachmentUrl: '',
      });
      loadLeaves();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      toast({
        title: 'Error',
        description: err.response?.data?.error || 'Failed to submit leave request',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
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
    return <Badge className={typeInfo.className}>{typeInfo.label}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Leave Request</h2>
        <p className="text-muted-foreground">
          Submit a leave request for approval
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Request Form */}
        <Card>
          <CardHeader>
            <CardTitle>New Leave Request</CardTitle>
            <CardDescription>
              Fill in the form to submit a leave request
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="leave-type">Leave Type *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: 'SICK' | 'PERMISSION' | 'ANNUAL') =>
                    setFormData({ ...formData, type: value })
                  }
                  required
                >
                  <SelectTrigger id="leave-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SICK">Sick Leave</SelectItem>
                    <SelectItem value="PERMISSION">Permission</SelectItem>
                    <SelectItem value="ANNUAL">Annual Leave</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="leave-startDate">Start Date *</Label>
                  <Input
                    id="leave-startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    required
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="leave-endDate">End Date *</Label>
                  <Input
                    id="leave-endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    required
                    min={formData.startDate || new Date().toISOString().split('T')[0]}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="leave-reason">Reason *</Label>
                <Textarea
                  id="leave-reason"
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  placeholder="Please provide a reason for your leave request"
                  required
                  rows={4}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="leave-attachment">Attachment URL (Optional)</Label>
                <Input
                  id="leave-attachment"
                  type="url"
                  value={formData.attachmentUrl}
                  onChange={(e) => setFormData({ ...formData, attachmentUrl: e.target.value })}
                  placeholder="https://example.com/document.pdf"
                />
                <p className="text-xs text-muted-foreground">
                  For medical certificates or supporting documents
                </p>
              </div>
              <Button type="submit" disabled={submitting} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                {submitting ? 'Submitting...' : 'Submit Request'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* My Requests */}
        <Card>
          <CardHeader>
            <CardTitle>My Leave Requests</CardTitle>
            <CardDescription>
              View status of your submitted requests
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Loading requests...</p>
              </div>
            ) : leaves.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">
                  No leave requests yet. Submit your first request above.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {leaves.map((leave) => (
                  <Card key={leave._id} className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        {getTypeBadge(leave.type)}
                        {getStatusBadge(leave.status)}
                      </div>
                      <div className="text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground mb-1">
                          <Calendar className="h-3 w-3" />
                          <span>
                            {formatDate(leave.startDate)} - {formatDate(leave.endDate)}
                          </span>
                        </div>
                        <p className="text-sm mt-2">{leave.reason}</p>
                      </div>
                      {leave.rejectionReason && (
                        <div className="text-sm text-destructive bg-destructive/10 p-2 rounded">
                          <strong>Rejection Reason:</strong> {leave.rejectionReason}
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

