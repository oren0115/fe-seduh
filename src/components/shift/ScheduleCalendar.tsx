import { useState, useEffect, useCallback } from 'react';
import { shiftService, Shift, CreateShiftData } from '@/lib/api-services';
import { userService, User } from '@/lib/api-services';
import { shiftTemplateService, ShiftTemplate } from '@/lib/api-services';
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
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatDate, cn } from '@/lib/utils';

export function ScheduleCalendar() {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [templates, setTemplates] = useState<ShiftTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const { toast } = useToast();

  const [formData, setFormData] = useState<CreateShiftData>({
    userId: '',
    date: '',
    shiftTemplateId: '',
    startTime: '09:00',
    endTime: '17:00',
    breakMinutes: 30,
    notes: '',
  });

  // Get week dates
  const getWeekDates = (date: Date) => {
    const week: Date[] = [];
    const start = new Date(date);
    const day = start.getDay();
    const diff = start.getDate() - day;
    start.setDate(diff);

    for (let i = 0; i < 7; i++) {
      const current = new Date(start);
      current.setDate(start.getDate() + i);
      week.push(current);
    }
    return week;
  };

  const weekDates = getWeekDates(currentDate);

  const loadShifts = useCallback(async () => {
    try {
      setLoading(true);
      // Calculate week dates inside the callback to avoid dependency issues
      const week = getWeekDates(currentDate);
      const startDate = week[0].toISOString().split('T')[0];
      const endDate = week[6].toISOString().split('T')[0];
      const response = await shiftService.getAll({ startDate, endDate });
      setShifts(response.data);
    } catch (error) {
      console.error('Failed to load shifts:', error);
      toast({
        title: 'Error',
        description: 'Failed to load shifts',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [currentDate, toast]);

  const loadUsers = useCallback(async () => {
    try {
      const response = await userService.getAll();
      const kasirUsers = response.data.filter((u) => u.role === 'KASIR' && u.isActive);
      setUsers(kasirUsers);
    } catch (error) {
      console.error('Failed to load users:', error);
    }
  }, []);

  const loadTemplates = useCallback(async () => {
    try {
      const response = await shiftTemplateService.getAll(true);
      setTemplates(response.data);
    } catch (error) {
      console.error('Failed to load templates:', error);
    }
  }, []);

  useEffect(() => {
    loadUsers();
    loadTemplates();
  }, [loadUsers, loadTemplates]);

  useEffect(() => {
    loadShifts();
  }, [loadShifts]);

  const handlePreviousWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() - 7);
    setCurrentDate(newDate);
  };

  const handleNextWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + 7);
    setCurrentDate(newDate);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const handleCellClick = (date: string, userId?: string) => {
    setSelectedDate(date);
    setFormData({
      userId: userId || '',
      date,
      shiftTemplateId: '',
      startTime: '09:00',
      endTime: '17:00',
      breakMinutes: 30,
      notes: '',
    });
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedDate('');
    setFormData({
      userId: '',
      date: '',
      shiftTemplateId: '',
      startTime: '09:00',
      endTime: '17:00',
      breakMinutes: 30,
      notes: '',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await shiftService.create(formData);
      handleCloseDialog();
      toast({
        title: 'Success',
        description: 'Shift created successfully',
      });
      loadShifts();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      toast({
        title: 'Error',
        description: err.response?.data?.error || 'Failed to create shift',
        variant: 'destructive',
      });
    }
  };

  const getShiftForCell = (userId: string, date: string) => {
    return shifts.find(
      (s) => s.userId === userId && s.date === date && s.status !== 'CANCELLED'
    );
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Schedule Calendar</h2>
          <p className="text-muted-foreground">
            View and manage weekly shift schedules
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handlePreviousWeek}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={handleToday}>
            Today
          </Button>
          <Button variant="outline" onClick={handleNextWeek}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            Week of {formatDate(weekDates[0].toISOString().split('T')[0])} -{' '}
            {formatDate(weekDates[6].toISOString().split('T')[0])}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Loading schedule...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <div className="min-w-full">
                {/* Header */}
                <div className="grid grid-cols-8 gap-2 mb-2">
                  <div className="font-semibold text-sm text-muted-foreground">Employee</div>
                  {weekDates.map((date, idx) => (
                    <div
                      key={idx}
                      className={cn(
                        'text-center font-semibold text-sm p-2 rounded',
                        isToday(date) && 'bg-primary/10 text-primary'
                      )}
                    >
                      <div>{dayNames[date.getDay()]}</div>
                      <div className="text-xs">{date.getDate()}</div>
                    </div>
                  ))}
                </div>

                {/* Rows */}
                {users.map((user) => (
                  <div key={user._id} className="grid grid-cols-8 gap-2 mb-2">
                    <div className="font-medium text-sm p-2 flex items-center">
                      {user.name}
                    </div>
                    {weekDates.map((date, idx) => {
                      const dateStr = date.toISOString().split('T')[0];
                      const shift = getShiftForCell(user._id, dateStr);
                      return (
                        <div
                          key={idx}
                          className={cn(
                            'min-h-[60px] p-2 rounded border cursor-pointer hover:bg-accent transition-colors',
                            isToday(date) && 'border-primary border-2',
                            shift && 'bg-primary/10 border-primary/20'
                          )}
                          onClick={() => handleCellClick(dateStr, user._id)}
                        >
                          {shift ? (
                            <div className="space-y-1">
                              <div className="text-xs font-medium">
                                {shift.startTime} - {shift.endTime}
                              </div>
                              <Badge
                                variant={
                                  shift.status === 'COMPLETED'
                                    ? 'default'
                                    : shift.status === 'ON_SHIFT' || shift.status === 'LATE'
                                    ? 'secondary'
                                    : 'outline'
                                }
                                className="text-xs"
                              >
                                {shift.status}
                              </Badge>
                            </div>
                          ) : (
                            <div className="text-xs text-muted-foreground flex items-center justify-center h-full">
                              <Plus className="h-4 w-4" />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Shift Dialog */}
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Assign Shift</DialogTitle>
            <DialogDescription>
              Create a shift schedule for {selectedDate && formatDate(selectedDate)}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="schedule-userId">Cashier *</Label>
                <Select
                  value={formData.userId}
                  onValueChange={(value) => setFormData({ ...formData, userId: value })}
                  required
                >
                  <SelectTrigger id="schedule-userId">
                    <SelectValue placeholder="Select cashier" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((user) => (
                      <SelectItem key={user._id} value={user._id}>
                        {user.name} ({user.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="schedule-template">Shift Template (Optional)</Label>
                <Select
                  value={formData.shiftTemplateId || undefined}
                  onValueChange={(value) => {
                    const template = templates.find((t) => t._id === value);
                    if (template) {
                      setFormData({
                        ...formData,
                        shiftTemplateId: value,
                        startTime: template.startTime,
                        endTime: template.endTime,
                        breakMinutes: template.breakMinutes,
                      });
                    } else {
                      setFormData({ ...formData, shiftTemplateId: '' });
                    }
                  }}
                >
                  <SelectTrigger id="schedule-template">
                    <SelectValue placeholder="Select template (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map((template) => (
                      <SelectItem key={template._id} value={template._id}>
                        {template.name} ({template.startTime} - {template.endTime})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="schedule-startTime">Start Time *</Label>
                  <Input
                    id="schedule-startTime"
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="schedule-endTime">End Time *</Label>
                  <Input
                    id="schedule-endTime"
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="schedule-breakMinutes">Break (minutes) *</Label>
                <Input
                  id="schedule-breakMinutes"
                  type="number"
                  value={formData.breakMinutes}
                  onChange={(e) =>
                    setFormData({ ...formData, breakMinutes: parseInt(e.target.value) || 30 })
                  }
                  required
                  min={0}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="schedule-notes">Notes</Label>
                <Input
                  id="schedule-notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Optional notes"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Cancel
              </Button>
              <Button type="submit">Create Shift</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

