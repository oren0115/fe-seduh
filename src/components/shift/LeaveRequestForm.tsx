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
import { Plus, Clock, CheckCircle2, XCircle, Calendar, FileText, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatDate, cn } from '@/lib/utils';

export function LeaveRequestForm() {
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [attachmentError, setAttachmentError] = useState<string>('');
  const { toast } = useToast();

  const [formData, setFormData] = useState<CreateLeaveRequestData>({
    type: 'PERMISSION',
    startDate: '',
    endDate: '',
    reason: '',
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAttachmentError('');
    const file = e.target.files?.[0];
    
    if (!file) {
      setAttachmentFile(null);
      return;
    }

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/webp',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    if (!allowedTypes.includes(file.type)) {
      setAttachmentError('Invalid file type. Allowed: PDF, JPEG, PNG, WebP, DOC, DOCX');
      setAttachmentFile(null);
      e.target.value = ''; // Reset input
      return;
    }

    // Validate file size (5MB = 5 * 1024 * 1024 bytes)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setAttachmentError('File size too large. Maximum size is 5MB.');
      setAttachmentFile(null);
      e.target.value = ''; // Reset input
      return;
    }

    setAttachmentFile(file);
  };

  const handleRemoveFile = () => {
    setAttachmentFile(null);
    setAttachmentError('');
    // Reset file input
    const fileInput = document.getElementById('leave-attachment') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  const getAttachmentUrl = (url?: string): string | undefined => {
    if (!url) return undefined;
    // If it's already a full URL (Cloudinary), return as is
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    // If it's a local path, prepend API URL
    const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    return `${apiBaseUrl}${url}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear previous errors
    setAttachmentError('');

    // Validate file if provided
    if (attachmentFile) {
      const allowedTypes = [
        'application/pdf',
        'image/jpeg',
        'image/png',
        'image/webp',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      ];
      if (!allowedTypes.includes(attachmentFile.type)) {
        setAttachmentError('Invalid file type. Allowed: PDF, JPEG, PNG, WebP, DOC, DOCX');
        return;
      }
      const maxSize = 5 * 1024 * 1024;
      if (attachmentFile.size > maxSize) {
        setAttachmentError('File size too large. Maximum size is 5MB.');
        return;
      }
    }

    try {
      setSubmitting(true);
      await leaveRequestService.create(formData, attachmentFile || undefined);
      toast({
        title: 'Success',
        description: 'Leave request submitted successfully',
      });
      setFormData({
        type: 'PERMISSION',
        startDate: '',
        endDate: '',
        reason: '',
      });
      setAttachmentFile(null);
      setAttachmentError('');
      // Reset file input
      const fileInput = document.getElementById('leave-attachment') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }
      loadLeaves();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      const errorMessage = err.response?.data?.error || 'Failed to submit leave request';
      
      // Check if error is related to file upload
      if (errorMessage.toLowerCase().includes('file') || 
          errorMessage.toLowerCase().includes('upload') ||
          errorMessage.toLowerCase().includes('invalid file type')) {
        setAttachmentError(errorMessage);
      } else {
        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive',
        });
      }
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
                <Label htmlFor="leave-attachment">Attachment (Optional)</Label>
                <Input
                  id="leave-attachment"
                  type="file"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp"
                  onChange={handleFileChange}
                />
                <p className="text-xs text-muted-foreground">
                  For medical certificates or supporting documents. Allowed: PDF, JPEG, PNG, WebP, DOC, DOCX (Max 5MB)
                </p>
                {attachmentError && (
                  <p className="text-xs text-destructive font-medium">
                    {attachmentError}
                  </p>
                )}
                {attachmentFile && (
                  <div className="mt-2 p-3 bg-muted rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{attachmentFile.name}</span>
                      <span className="text-xs text-muted-foreground">
                        ({(attachmentFile.size / 1024 / 1024).toFixed(2)} MB)
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleRemoveFile}
                      className="h-6 w-6 p-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
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
                      {leave.attachmentUrl && (
                        <div className="mt-2">
                          <a
                            href={getAttachmentUrl(leave.attachmentUrl)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                          >
                            <FileText className="h-4 w-4" />
                            View Attachment
                          </a>
                        </div>
                      )}
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

