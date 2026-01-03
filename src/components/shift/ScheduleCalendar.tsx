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
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Plus, ChevronLeft, ChevronRight, Copy, Repeat, BookOpen, Edit, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatDate, cn } from '@/lib/utils';

export function ScheduleCalendar() {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [templates, setTemplates] = useState<ShiftTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [openDialog, setOpenDialog] = useState(false);
  const [openCopyDialog, setOpenCopyDialog] = useState(false);
  const [openRecurringDialog, setOpenRecurringDialog] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedCell, setSelectedCell] = useState<{ date: string; userId?: string; x?: number; y?: number } | null>(null);
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [selectedDaysOfWeek, setSelectedDaysOfWeek] = useState<number[]>([]);
  const [recurringDuration, setRecurringDuration] = useState<'week' | 'weeks' | 'ongoing' | 'custom'>('weeks');
  const [recurringWeeks, setRecurringWeeks] = useState(2);
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

  const [bulkFormData, setBulkFormData] = useState<{
    startDate: string;
    endDate: string;
    daysOfWeek: number[];
  }>({
    startDate: '',
    endDate: '',
    daysOfWeek: [],
  });

  // Get month dates (all days in the month)
  const getMonthDates = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    
    // First day of the month
    const firstDay = new Date(year, month, 1);
    // Last day of the month
    const lastDay = new Date(year, month + 1, 0);
    
    // Start from the first day of the week that contains the first day of month
    const startDate = new Date(firstDay);
    const dayOfWeek = startDate.getDay();
    startDate.setDate(startDate.getDate() - dayOfWeek);
    
    // End at the last day of the week that contains the last day of month
    const endDate = new Date(lastDay);
    const lastDayOfWeek = endDate.getDay();
    endDate.setDate(endDate.getDate() + (6 - lastDayOfWeek));
    
    const dates: Date[] = [];
    const current = new Date(startDate);
    
    while (current <= endDate) {
      dates.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    
    return dates;
  };

  const monthDates = getMonthDates(currentDate);

  const loadShifts = useCallback(async () => {
    try {
      setLoading(true);
      // Calculate month dates inside the callback to avoid dependency issues
      const monthDatesArray = getMonthDates(currentDate);
      const startDate = monthDatesArray[0].toISOString().split('T')[0];
      const endDate = monthDatesArray[monthDatesArray.length - 1].toISOString().split('T')[0];
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

  const handlePreviousMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() - 1);
    setCurrentDate(newDate);
  };

  const handleNextMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + 1);
    setCurrentDate(newDate);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const handleCellClick = (date: string, userId?: string, e?: React.MouseEvent) => {
    // Right-click opens context menu
    if (e?.button === 2 || (e?.ctrlKey && e?.button === 0)) {
      e.preventDefault();
      setSelectedCell({ date, userId });
      return;
    }
    
    setSelectedDate(date);
    setIsBulkMode(false);
    setSelectedDaysOfWeek([]);
    setFormData({
      userId: userId || '',
      date,
      shiftTemplateId: '',
      startTime: '09:00',
      endTime: '17:00',
      breakMinutes: 30,
      notes: '',
    });
    setBulkFormData({
      startDate: date,
      endDate: date,
      daysOfWeek: [],
    });
    setOpenDialog(true);
  };

  const handleQuickRecurring = () => {
    setOpenRecurringDialog(true);
    const monthDatesArray = getMonthDates(currentDate);
    setFormData({
      userId: '',
      date: selectedDate || monthDatesArray[0].toISOString().split('T')[0],
      shiftTemplateId: '',
      startTime: '09:00',
      endTime: '17:00',
      breakMinutes: 30,
      notes: '',
    });
  };

  const handleCopyPreviousMonth = async () => {
    try {
      const currentMonthDates = getMonthDates(currentDate);
      const previousMonthDate = new Date(currentDate);
      previousMonthDate.setMonth(previousMonthDate.getMonth() - 1);
      const previousMonthDates = getMonthDates(previousMonthDate);

      const startDate = previousMonthDates[0].toISOString().split('T')[0];
      const endDate = previousMonthDates[previousMonthDates.length - 1].toISOString().split('T')[0];

      const response = await shiftService.getAll({ startDate, endDate });
      const previousShifts = response.data;

      if (previousShifts.length === 0) {
        toast({
          title: 'No shifts found',
          description: 'No shifts found in the previous month to copy',
          variant: 'destructive',
        });
        return;
      }

      // Create shifts for current month based on previous month
      const currentMonthStart = currentMonthDates[0];
      const previousMonthStart = previousMonthDates[0];
      const daysDiff = Math.floor((currentMonthStart.getTime() - previousMonthStart.getTime()) / (1000 * 60 * 60 * 24));

      let created = 0;
      let skipped = 0;

      for (const prevShift of previousShifts) {
        const prevDate = new Date(prevShift.date);
        const newDate = new Date(prevDate);
        newDate.setDate(newDate.getDate() + daysDiff);
        const newDateStr = newDate.toISOString().split('T')[0];

        // Check if shift already exists
        const exists = shifts.find(
          (s) => s.userId === prevShift.userId && s.date === newDateStr
        );

        if (!exists) {
          try {
            await shiftService.create({
              userId: prevShift.userId,
              date: newDateStr,
              startTime: prevShift.startTime,
              endTime: prevShift.endTime,
              breakMinutes: prevShift.breakMinutes,
              notes: prevShift.notes,
            });
            created++;
          } catch (error) {
            skipped++;
          }
        } else {
          skipped++;
        }
      }

      toast({
        title: 'Success',
        description: `Copied ${created} shift(s)${skipped > 0 ? `, skipped ${skipped}` : ''}`,
      });

      loadShifts();
      setOpenCopyDialog(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to copy previous month',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteShift = async (shift: Shift) => {
    if (!confirm(`Delete shift on ${formatDate(shift.date)}?`)) return;

    try {
      await shiftService.delete(shift._id);
      toast({
        title: 'Success',
        description: 'Shift deleted successfully',
      });
      loadShifts();
      setSelectedCell(null);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete shift',
        variant: 'destructive',
      });
    }
  };

  const handleEditShift = (shift: Shift) => {
    setSelectedDate(shift.date);
    setIsBulkMode(false);
    setFormData({
      userId: shift.userId,
      date: shift.date,
      shiftTemplateId: '',
      startTime: shift.startTime,
      endTime: shift.endTime,
      breakMinutes: shift.breakMinutes,
      notes: shift.notes || '',
    });
    setOpenDialog(true);
    setSelectedCell(null);
  };

  const handleCopyToOtherDays = (shift: Shift) => {
    setFormData({
      userId: shift.userId,
      date: '',
      shiftTemplateId: '',
      startTime: shift.startTime,
      endTime: shift.endTime,
      breakMinutes: shift.breakMinutes,
      notes: shift.notes || '',
    });
    setIsBulkMode(true);
    const monthDatesArray = getMonthDates(currentDate);
    setBulkFormData({
      startDate: monthDatesArray[0].toISOString().split('T')[0],
      endDate: monthDatesArray[monthDatesArray.length - 1].toISOString().split('T')[0],
      daysOfWeek: [],
    });
    setOpenDialog(true);
    setSelectedCell(null);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setOpenRecurringDialog(false);
    setSelectedDate('');
    setIsBulkMode(false);
    setSelectedDaysOfWeek([]);
    setRecurringDuration('weeks');
    setRecurringWeeks(2);
    setFormData({
      userId: '',
      date: '',
      shiftTemplateId: '',
      startTime: '09:00',
      endTime: '17:00',
      breakMinutes: 30,
      notes: '',
    });
    setBulkFormData({
      startDate: '',
      endDate: '',
      daysOfWeek: [],
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isBulkMode || openRecurringDialog) {
        // Calculate end date based on duration
        let endDateStr = bulkFormData.endDate;
        if (openRecurringDialog) {
          const startDate = new Date(bulkFormData.startDate);
          let calculatedEndDate: Date;
          
          if (recurringDuration === 'week') {
            calculatedEndDate = new Date(startDate);
            calculatedEndDate.setDate(calculatedEndDate.getDate() + 6);
          } else if (recurringDuration === 'weeks') {
            calculatedEndDate = new Date(startDate);
            calculatedEndDate.setDate(calculatedEndDate.getDate() + (recurringWeeks * 7 - 1));
          } else if (recurringDuration === 'ongoing') {
            calculatedEndDate = new Date(startDate);
            calculatedEndDate.setDate(calculatedEndDate.getDate() + (4 * 7 - 1)); // 4 weeks default for ongoing
          } else {
            calculatedEndDate = new Date(bulkFormData.endDate);
          }
          endDateStr = calculatedEndDate.toISOString().split('T')[0];
        }

        // Bulk create
        const result = await shiftService.createBulk({
          userId: formData.userId,
          startDate: bulkFormData.startDate,
          endDate: endDateStr,
          startTime: formData.startTime,
          endTime: formData.endTime,
          breakMinutes: formData.breakMinutes,
          daysOfWeek: selectedDaysOfWeek.length > 0 ? selectedDaysOfWeek : undefined,
          notes: formData.notes,
        });
        handleCloseDialog();
        setOpenRecurringDialog(false);
        toast({
          title: 'Success',
          description: `Created ${result.data.created} shift(s)${result.data.skipped > 0 ? `, skipped ${result.data.skipped}` : ''}`,
        });
      } else {
        // Single create
        await shiftService.create(formData);
        handleCloseDialog();
        toast({
          title: 'Success',
          description: 'Shift created successfully',
        });
      }
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

  const toggleDayOfWeek = (day: number) => {
    setSelectedDaysOfWeek((prev) => {
      const newDays = prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort();
      setBulkFormData((prevBulk) => ({ ...prevBulk, daysOfWeek: newDays }));
      return newDays;
    });
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
            View and manage monthly shift schedules
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handlePreviousMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={handleToday}>
            Today
          </Button>
          <Button variant="outline" onClick={handleNextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Quick Actions Toolbar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-muted-foreground mr-2">Quick Actions:</span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleQuickRecurring}
              className="gap-2"
            >
              <Repeat className="h-4 w-4" />
              Create Recurring Shift
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setOpenCopyDialog(true)}
              className="gap-2"
            >
              <Copy className="h-4 w-4" />
              Copy Previous Month
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <BookOpen className="h-4 w-4" />
                  Quick Templates
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                {templates.length === 0 ? (
                  <div className="p-2 text-sm text-muted-foreground">No templates available</div>
                ) : (
                  templates.map((template) => (
                    <DropdownMenuItem
                      key={template._id}
                      onClick={() => {
                        setFormData((prev) => ({
                          ...prev,
                          shiftTemplateId: template._id,
                          startTime: template.startTime,
                          endTime: template.endTime,
                          breakMinutes: template.breakMinutes,
                        }));
                        setIsBulkMode(true);
                        const monthDatesArray = getMonthDates(currentDate);
                        setBulkFormData({
                          startDate: monthDatesArray[0].toISOString().split('T')[0],
                          endDate: monthDatesArray[monthDatesArray.length - 1].toISOString().split('T')[0],
                          daysOfWeek: [],
                        });
                        setOpenDialog(true);
                      }}
                    >
                      <div className="flex flex-col">
                        <span className="font-medium">{template.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {template.startTime} - {template.endTime}
                        </span>
                      </div>
                    </DropdownMenuItem>
                  ))
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">
            {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
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
                {/* Day Headers */}
                <div className="grid grid-cols-8 gap-2 mb-2">
                  <div className="font-semibold text-sm text-muted-foreground p-2">Employee</div>
                  {dayNames.map((day) => (
                    <div key={day} className="text-center text-sm font-semibold text-muted-foreground p-2">
                      {day}
                    </div>
                  ))}
                </div>

                {/* Calendar Grid */}
                <div className="space-y-2">
                  {users.map((user) => (
                    <div key={user._id} className="space-y-2">
                      {/* User Name Row */}
                      <div className="grid grid-cols-8 gap-2">
                        <div className="font-medium text-sm p-2 flex items-center sticky left-0 bg-background z-10">
                          {user.name}
                        </div>
                        <div className="col-span-7 grid grid-cols-7 gap-2">
                          {monthDates.map((date, idx) => {
                            const dateStr = date.toISOString().split('T')[0];
                            const shift = getShiftForCell(user._id, dateStr);
                            const isTodayDate = isToday(date);
                            const isCurrentMonth = date.getMonth() === currentDate.getMonth();
                            
                            return (
                              <div
                                key={idx}
                                className={cn(
                                  'min-h-[60px] p-1.5 rounded border cursor-pointer hover:bg-accent transition-colors text-xs',
                                  !isCurrentMonth && 'opacity-40',
                                  isTodayDate && 'border-primary border-2',
                                  shift && 'bg-primary/10 border-primary/20'
                                )}
                                onClick={(e) => handleCellClick(dateStr, user._id, e)}
                                onContextMenu={(e) => {
                                  e.preventDefault();
                                  if (shift) {
                                    setSelectedCell({ 
                                      date: dateStr, 
                                      userId: user._id,
                                      x: e.clientX,
                                      y: e.clientY
                                    });
                                  }
                                }}
                              >
                                <div className="text-[9px] font-semibold mb-1">
                                  {date.getDate()}
                                </div>
                                {shift ? (
                                  <div className="space-y-0.5">
                                    <div className="text-[9px] font-medium leading-tight">
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
                                      className="text-[8px] px-1 py-0"
                                    >
                                      {shift.status}
                                    </Badge>
                                  </div>
                                ) : (
                                  <div className="text-[9px] text-muted-foreground flex items-center justify-center h-full pt-1">
                                    <Plus className="h-3 w-3" />
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Right-Click Context Menu */}
      {selectedCell && (() => {
        const shift = selectedCell.userId 
          ? getShiftForCell(selectedCell.userId, selectedCell.date)
          : null;
        if (!shift) {
          setSelectedCell(null);
          return null;
        }
        return (
          <DropdownMenu 
            open={!!selectedCell} 
            onOpenChange={(open) => {
              if (!open) setSelectedCell(null);
            }}
          >
            <DropdownMenuTrigger asChild>
              <div className="fixed" style={{ 
                left: -9999, 
                top: -9999,
                position: 'absolute'
              }} />
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              align="start"
              onCloseAutoFocus={(e) => e.preventDefault()}
            >
              <DropdownMenuItem onClick={() => handleEditShift(shift)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Shift
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleCopyToOtherDays(shift)}>
                <Copy className="h-4 w-4 mr-2" />
                Copy to Other Days
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => {
                  setFormData({
                    userId: shift.userId,
                    date: shift.date,
                    shiftTemplateId: '',
                    startTime: shift.startTime,
                    endTime: shift.endTime,
                    breakMinutes: shift.breakMinutes,
                    notes: shift.notes || '',
                  });
                  setIsBulkMode(true);
                  setBulkFormData({
                    startDate: shift.date,
                    endDate: shift.date,
                    daysOfWeek: [],
                  });
                  setOpenRecurringDialog(true);
                  setSelectedCell(null);
                }}
              >
                <Repeat className="h-4 w-4 mr-2" />
                Make Recurring
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => handleDeleteShift(shift)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      })()}

      {/* Copy Previous Week Dialog */}
      <Dialog open={openCopyDialog} onOpenChange={setOpenCopyDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Copy Previous Month</DialogTitle>
            <DialogDescription>
              Copy all shifts from the previous month to the current month ({currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })})
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              This will create shifts for the current month based on the previous month's schedule.
              Existing shifts will be skipped.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenCopyDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCopyPreviousMonth}>
              <Copy className="h-4 w-4 mr-2" />
              Copy Shifts
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Recurring Shift Dialog */}
      <Dialog open={openRecurringDialog} onOpenChange={setOpenRecurringDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Recurring Shift</DialogTitle>
            <DialogDescription>
              Create shifts that repeat on selected days for a specified duration
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="recurring-userId">Cashier *</Label>
                <Select
                  value={formData.userId}
                  onValueChange={(value) => setFormData({ ...formData, userId: value })}
                  required
                >
                  <SelectTrigger id="recurring-userId">
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

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="recurring-startDate">Start Date *</Label>
                  <Input
                    id="recurring-startDate"
                    type="date"
                    value={bulkFormData.startDate}
                    onChange={(e) =>
                      setBulkFormData({ ...bulkFormData, startDate: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Duration *</Label>
                  <Select
                    value={recurringDuration}
                    onValueChange={(value: 'week' | 'weeks' | 'ongoing' | 'custom') => {
                      setRecurringDuration(value);
                      if (value === 'weeks' && bulkFormData.startDate) {
                        const start = new Date(bulkFormData.startDate);
                        const end = new Date(start);
                        end.setDate(end.getDate() + (recurringWeeks * 7 - 1));
                        setBulkFormData({ ...bulkFormData, endDate: end.toISOString().split('T')[0] });
                      } else if (value === 'week' && bulkFormData.startDate) {
                        const start = new Date(bulkFormData.startDate);
                        const end = new Date(start);
                        end.setDate(end.getDate() + 6);
                        setBulkFormData({ ...bulkFormData, endDate: end.toISOString().split('T')[0] });
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="week">This week only</SelectItem>
                      <SelectItem value="weeks">Next N weeks</SelectItem>
                      <SelectItem value="ongoing">Ongoing (4 weeks)</SelectItem>
                      <SelectItem value="custom">Custom date range</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {recurringDuration === 'weeks' && (
                <div className="space-y-2">
                  <Label htmlFor="recurring-weeks">Number of Weeks *</Label>
                  <Input
                    id="recurring-weeks"
                    type="number"
                    min={1}
                    max={12}
                    value={recurringWeeks}
                    onChange={(e) => {
                      const weeks = parseInt(e.target.value) || 2;
                      setRecurringWeeks(weeks);
                      if (bulkFormData.startDate) {
                        const start = new Date(bulkFormData.startDate);
                        const end = new Date(start);
                        end.setDate(end.getDate() + (weeks * 7 - 1));
                        setBulkFormData({ ...bulkFormData, endDate: end.toISOString().split('T')[0] });
                      }
                    }}
                    required
                  />
                </div>
              )}

              {recurringDuration === 'custom' && (
                <div className="space-y-2">
                  <Label htmlFor="recurring-endDate">End Date *</Label>
                  <Input
                    id="recurring-endDate"
                    type="date"
                    value={bulkFormData.endDate}
                    onChange={(e) =>
                      setBulkFormData({ ...bulkFormData, endDate: e.target.value })
                    }
                    min={bulkFormData.startDate}
                    required
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label>Days of Week *</Label>
                <div className="grid grid-cols-7 gap-2 p-3 border rounded-lg">
                  {dayNames.map((day, index) => (
                    <div key={index} className="flex flex-col items-center gap-1">
                      <Checkbox
                        id={`recurring-day-${index}`}
                        checked={selectedDaysOfWeek.includes(index)}
                        onCheckedChange={() => toggleDayOfWeek(index)}
                      />
                      <Label
                        htmlFor={`recurring-day-${index}`}
                        className="text-xs cursor-pointer text-center"
                      >
                        {day}
                      </Label>
                    </div>
                  ))}
                </div>
                {selectedDaysOfWeek.length === 0 && (
                  <p className="text-xs text-destructive">Please select at least one day</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="recurring-template">Shift Template (Optional)</Label>
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
                  <SelectTrigger id="recurring-template">
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
                  <Label htmlFor="recurring-startTime">Start Time *</Label>
                  <Input
                    id="recurring-startTime"
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="recurring-endTime">End Time *</Label>
                  <Input
                    id="recurring-endTime"
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="recurring-breakMinutes">Break (minutes) *</Label>
                <Input
                  id="recurring-breakMinutes"
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
                <Label htmlFor="recurring-notes">Notes</Label>
                <Input
                  id="recurring-notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Optional notes"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpenRecurringDialog(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={selectedDaysOfWeek.length === 0}>
                <Repeat className="h-4 w-4 mr-2" />
                Create Recurring Shifts
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Create Shift Dialog */}
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Assign Shift</DialogTitle>
            <DialogDescription>
              {isBulkMode 
                ? 'Create shifts for multiple dates at once'
                : `Create a shift schedule for ${selectedDate && formatDate(selectedDate)}`
              }
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              {/* Mode Toggle */}
              <div className="flex items-center gap-4 p-3 border rounded-lg">
                <Label htmlFor="single-mode" className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    id="single-mode"
                    name="mode"
                    checked={!isBulkMode}
                    onChange={() => {
                      setIsBulkMode(false);
                      setSelectedDaysOfWeek([]);
                      if (selectedDate) {
                        setFormData((prev) => ({ ...prev, date: selectedDate }));
                        setBulkFormData({
                          startDate: selectedDate,
                          endDate: selectedDate,
                          daysOfWeek: [],
                        });
                      }
                    }}
                    className="w-4 h-4"
                  />
                  <span>Single Date</span>
                </Label>
                <Label htmlFor="bulk-mode" className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    id="bulk-mode"
                    name="mode"
                    checked={isBulkMode}
                    onChange={() => {
                      setIsBulkMode(true);
                      if (selectedDate) {
                        setBulkFormData({
                          startDate: selectedDate,
                          endDate: selectedDate,
                          daysOfWeek: selectedDaysOfWeek,
                        });
                      }
                    }}
                    className="w-4 h-4"
                  />
                  <span>Date Range</span>
                </Label>
              </div>

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

              {/* Date Selection */}
              {isBulkMode ? (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="bulk-startDate">Start Date *</Label>
                    <Input
                      id="bulk-startDate"
                      type="date"
                      value={bulkFormData.startDate}
                      onChange={(e) =>
                        setBulkFormData({ ...bulkFormData, startDate: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bulk-endDate">End Date *</Label>
                    <Input
                      id="bulk-endDate"
                      type="date"
                      value={bulkFormData.endDate}
                      onChange={(e) =>
                        setBulkFormData({ ...bulkFormData, endDate: e.target.value })
                      }
                      min={bulkFormData.startDate}
                      required
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="schedule-date">Date *</Label>
                  <Input
                    id="schedule-date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                  />
                </div>
              )}

              {/* Days of Week Selection (Bulk Mode Only) */}
              {isBulkMode && (
                <div className="space-y-2">
                  <Label>Days of Week (Optional - leave empty for all days)</Label>
                  <div className="grid grid-cols-7 gap-2 p-3 border rounded-lg">
                    {dayNames.map((day, index) => (
                      <div key={index} className="flex flex-col items-center gap-1">
                        <Checkbox
                          id={`day-${index}`}
                          checked={selectedDaysOfWeek.includes(index)}
                          onCheckedChange={() => toggleDayOfWeek(index)}
                        />
                        <Label
                          htmlFor={`day-${index}`}
                          className="text-xs cursor-pointer text-center"
                        >
                          {day}
                        </Label>
                      </div>
                    ))}
                  </div>
                  {selectedDaysOfWeek.length > 0 && (
                    <p className="text-xs text-muted-foreground">
                      Selected: {selectedDaysOfWeek.map(d => dayNames[d]).join(', ')}
                    </p>
                  )}
                  {selectedDaysOfWeek.length === 0 && (
                    <p className="text-xs text-muted-foreground italic">
                      All days will be scheduled
                    </p>
                  )}
                </div>
              )}

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
              <Button type="submit">
                {isBulkMode ? 'Create Shifts' : 'Create Shift'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

