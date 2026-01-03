import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { shiftService, Shift } from '@/lib/api-services';
import { holidayService, Holiday } from '@/lib/api-services';
import { leaveRequestService, LeaveRequest } from '@/lib/api-services';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export function MySchedule() {
  const { user } = useAuth();
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());

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

  const loadData = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      // Calculate month dates inside the callback to avoid dependency issues
      const monthDates = getMonthDates(currentDate);
      const startDate = monthDates[0].toISOString().split('T')[0];
      const endDate = monthDates[monthDates.length - 1].toISOString().split('T')[0];

      const [shiftsResponse, holidaysResponse, leavesResponse] = await Promise.all([
        shiftService.getAll({ userId: user._id, startDate, endDate }),
        holidayService.getAll({ startDate, endDate }),
        leaveRequestService.getMy(),
      ]);

      setShifts(shiftsResponse.data);
      setHolidays(holidaysResponse.data);
      setLeaves(leavesResponse.data);
    } catch (error) {
      console.error('Failed to load schedule:', error);
    } finally {
      setLoading(false);
    }
  }, [user, currentDate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

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

  const getShiftForDate = (date: string) => {
    return shifts.find((s) => s.date === date && s.status !== 'CANCELLED');
  };

  const getHolidayForDate = (date: string) => {
    return holidays.find((h) => h.date === date);
  };

  const getLeaveForDate = (date: string) => {
    return leaves.find(
      (l) =>
        l.status === 'APPROVED' &&
        date >= l.startDate &&
        date <= l.endDate
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

  // Calculate monthDates for display (not used as dependency to avoid infinite loop)
  const monthDates = getMonthDates(currentDate);
  
  // Get month and year for display
  const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  
  // Check if current month is displayed
  const todayDate = new Date();
  const isCurrentMonth = currentDate.getMonth() === todayDate.getMonth() && 
                         currentDate.getFullYear() === todayDate.getFullYear();

  // Get today's shift
  const todayStr = new Date().toISOString().split('T')[0];
  const todayShift = getShiftForDate(todayStr);
  const todayHoliday = getHolidayForDate(todayStr);
  const todayLeave = getLeaveForDate(todayStr);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">My Schedule</h2>
          <p className="text-muted-foreground">
            View your monthly shift schedule
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handlePreviousMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button 
            variant={isCurrentMonth ? "default" : "outline"} 
            onClick={handleToday}
            className={isCurrentMonth ? "bg-primary text-primary-foreground" : ""}
          >
            Today
          </Button>
          <Button variant="outline" onClick={handleNextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Today's Shift Reminder */}
      {todayShift && !todayHoliday && !todayLeave && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-primary" />
              Today's Shift
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">
                  {todayShift.startTime} - {todayShift.endTime}
                </span>
              </div>
              <div className="text-sm text-muted-foreground">
                Break: {todayShift.breakMinutes} minutes
              </div>
              {todayShift.notes && (
                <div className="text-sm text-muted-foreground">
                  Notes: {todayShift.notes}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Monthly Calendar */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">{monthName}</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Loading schedule...</p>
            </div>
          ) : (
            <div className="space-y-2">
              {/* Day Headers */}
              <div className="grid grid-cols-7 gap-2 mb-2">
                {dayNames.map((day) => (
                  <div key={day} className="text-center text-sm font-semibold text-muted-foreground py-2">
                    {day}
                  </div>
                ))}
              </div>
              
              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-2">
                {monthDates.map((date, idx) => {
                  const dateStr = date.toISOString().split('T')[0];
                  const shift = getShiftForDate(dateStr);
                  const holiday = getHolidayForDate(dateStr);
                  const leave = getLeaveForDate(dateStr);
                  const isTodayDate = isToday(date);
                  const isCurrentMonth = date.getMonth() === currentDate.getMonth();

                  return (
                    <Card
                      key={idx}
                      className={cn(
                        'min-h-[100px] md:min-h-[120px] relative',
                        !isCurrentMonth && 'opacity-40',
                        isTodayDate && 'border-primary border-2 bg-primary/5 dark:bg-primary/10',
                        holiday && !isTodayDate && 'bg-yellow-50 dark:bg-yellow-900/10',
                        leave && !isTodayDate && 'bg-blue-50 dark:bg-blue-900/10'
                      )}
                    >
                      {isTodayDate && (
                        <div className="absolute top-1 right-1 h-2 w-2 rounded-full bg-primary" />
                      )}
                      <CardHeader className="pb-1 p-2">
                        <CardTitle className={cn(
                          "text-xs md:text-sm font-semibold",
                          isTodayDate && "text-primary font-bold"
                        )}>
                          {date.getDate()}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-2 pt-0">
                        {holiday ? (
                          <div className="space-y-1">
                            <Badge variant="outline" className="bg-yellow-100 dark:bg-yellow-900/30 text-[9px] px-1 py-0">
                              Holiday
                            </Badge>
                            <p className="text-[9px] font-medium line-clamp-1">{holiday.name}</p>
                          </div>
                        ) : leave ? (
                          <div className="space-y-1">
                            <Badge variant="outline" className="bg-blue-100 dark:bg-blue-900/30 text-[9px] px-1 py-0">
                              Leave
                            </Badge>
                            <p className="text-[9px] text-muted-foreground line-clamp-1">
                              {leave.type === 'SICK' ? 'Sick' : leave.type === 'PERMISSION' ? 'Permission' : 'Annual'}
                            </p>
                          </div>
                        ) : shift ? (
                          <div className="space-y-1">
                            <Badge
                              variant={
                                shift.status === 'COMPLETED'
                                  ? 'default'
                                  : shift.status === 'ON_SHIFT' || shift.status === 'LATE'
                                  ? 'secondary'
                                  : 'outline'
                              }
                              className="text-[9px] px-1 py-0"
                            >
                              {shift.status}
                            </Badge>
                            <div className="flex items-center gap-0.5 text-[9px]">
                              <Clock className="h-2.5 w-2.5 text-muted-foreground" />
                              <span className="font-medium line-clamp-1">
                                {shift.startTime} - {shift.endTime}
                              </span>
                            </div>
                            <div className="text-[9px] text-muted-foreground">
                              {shift.breakMinutes}m
                            </div>
                          </div>
                        ) : (
                          <div className="text-[9px] text-muted-foreground text-center py-2">
                            -
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

