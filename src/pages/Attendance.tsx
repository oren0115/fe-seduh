import { useState, useEffect } from 'react';
import { attendanceService, Attendance as AttendanceType, AttendanceSummary, userService, User } from '@/lib/api-services';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { formatDate, formatDateTime } from '@/lib/utils';

interface AttendanceParams {
  date?: string;
  userId?: string;
}

function AttendancePage() {
  const [attendances, setAttendances] = useState<AttendanceType[]>([]);
  const [summary, setSummary] = useState<AttendanceSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);

  // Filters for attendance list
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split('T')[0]);
  const [userIdFilter] = useState<string>('');

  // Filters for summary
  const [summaryUserId, setSummaryUserId] = useState<string>('');
  const [summaryStartDate, setSummaryStartDate] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]
  );
  const [summaryEndDate, setSummaryEndDate] = useState(new Date().toISOString().split('T')[0]);

  const loadAttendances = async () => {
    try {
      setLoading(true);
      const params: AttendanceParams = { date: dateFilter };
      if (userIdFilter) params.userId = userIdFilter;

      const response = await attendanceService.getAll(params);
      setAttendances(response.data);
    } catch (error) {
      console.error('Failed to load attendances:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSummary = async () => {
    if (!summaryUserId || !summaryStartDate || !summaryEndDate) {
      alert('Please fill all summary fields');
      return;
    }

    try {
      setLoading(true);
      const response = await attendanceService.getSummary(
        summaryUserId,
        summaryStartDate,
        summaryEndDate
      );
      setSummary(response.data);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      alert(err.response?.data?.error || 'Failed to load summary');
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const response = await userService.getAll();
      setUsers(response.data.filter((u) => u.isActive)); // Only show active users
    } catch (error) {
      console.error('Failed to load users:', error);
    }
  };

  useEffect(() => {
    loadAttendances();
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateFilter, userIdFilter]);

  const formatMinutes = (minutes?: number) => {
    if (!minutes) return '0h 0m';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  return (
    <div className="space-y-6">

      <Tabs defaultValue="records" className="space-y-4">
        <TabsList>
          <TabsTrigger value="records">Attendance Records</TabsTrigger>
          <TabsTrigger value="summary">Summary</TabsTrigger>
        </TabsList>

        {/* Attendance Records */}
        <TabsContent value="records" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Attendance Records</CardTitle>
                  <CardDescription>View attendance history</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="date-filter">Date:</Label>
                  <Input
                    id="date-filter"
                    type="date"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="w-40"
                  />
                  <Button onClick={loadAttendances} disabled={loading}>
                    Load
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-12">Loading...</div>
              ) : attendances.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  No attendance records found
                </div>
              ) : (
                <div className="space-y-4">
                  {attendances.map((attendance) => (
                    <Card key={attendance._id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <div className="font-semibold">
                              {typeof attendance.userId === 'object'
                                ? attendance.userId.name
                                : 'Unknown User'}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {formatDate(attendance.date)}
                            </div>
                            <div className="text-sm">
                              <span className="text-muted-foreground">Clock In:</span>{' '}
                              {formatDateTime(attendance.clockIn)}
                            </div>
                            {attendance.clockOut && (
                              <div className="text-sm">
                                <span className="text-muted-foreground">Clock Out:</span>{' '}
                                {formatDateTime(attendance.clockOut)}
                              </div>
                            )}
                          </div>
                          <div className="text-right space-y-1">
                            <div className="text-sm">
                              <span className="text-muted-foreground">Total:</span>{' '}
                              <span className="font-semibold">
                                {formatMinutes(attendance.totalMinutes)}
                              </span>
                            </div>
                            {attendance.overtimeMinutes && attendance.overtimeMinutes > 0 && (
                              <div className="text-sm">
                                <span className="text-muted-foreground">Overtime:</span>{' '}
                                <span className="font-semibold text-orange-600">
                                  {formatMinutes(attendance.overtimeMinutes)}
                                </span>
                              </div>
                            )}
                            <div className="text-xs">
                              <span
                                className={`px-2 py-1 rounded ${
                                  attendance.status === 'COMPLETED'
                                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                    : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                                }`}
                              >
                                {attendance.status}
                              </span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Summary */}
        <TabsContent value="summary" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Attendance Summary</CardTitle>
              <CardDescription>Get attendance summary for payroll calculation</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="summary-user">Nama *</Label>
                    <Select
                      value={summaryUserId}
                      onValueChange={setSummaryUserId}
                      required
                    >
                      <SelectTrigger id="summary-user">
                        <SelectValue placeholder="Pilih nama user" />
                      </SelectTrigger>
                      <SelectContent>
                        {users.map((user) => (
                          <SelectItem key={user._id} value={user._id}>
                            {user.name} ({user.role})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Pilih nama user untuk melihat summary attendance.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="summary-start">Start Date *</Label>
                    <Input
                      id="summary-start"
                      type="date"
                      value={summaryStartDate}
                      onChange={(e) => setSummaryStartDate(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="summary-end">End Date *</Label>
                    <Input
                      id="summary-end"
                      type="date"
                      value={summaryEndDate}
                      onChange={(e) => setSummaryEndDate(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <Button onClick={loadSummary} disabled={loading}>
                  Load Summary
                </Button>

                {summary && (
                  <div className="mt-6 space-y-4">
                    {/* User Info */}
                    <Card className="bg-primary/5 border-primary/20">
                      <CardHeader>
                        <CardTitle className="text-lg">Employee Information</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <p className="text-sm text-muted-foreground mb-1">Name</p>
                            <p className="font-semibold text-lg">{summary.user.name}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground mb-1">Email</p>
                            <p className="font-semibold">{summary.user.email}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground mb-1">Role</p>
                            <p className="font-semibold">{summary.user.role}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Summary Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <Card>
                        <CardHeader className="pb-2">
                          <CardDescription>Total Days</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">{summary.totalDays}</div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader className="pb-2">
                          <CardDescription>Total Hours</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">
                            {summary.totalHours.toFixed(1)}h
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader className="pb-2">
                          <CardDescription>Total Minutes</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">{summary.totalMinutes}</div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader className="pb-2">
                          <CardDescription>Overtime Hours</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold text-orange-600">
                            {summary.totalOvertimeHours.toFixed(1)}h
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default AttendancePage;

