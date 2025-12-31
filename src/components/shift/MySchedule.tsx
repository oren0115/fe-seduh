import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { shiftService, Shift } from '@/lib/api-services';
import { holidayService, Holiday } from '@/lib/api-services';
import { leaveRequestService, LeaveRequest } from '@/lib/api-services';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react';
import { formatDate, cn } from '@/lib/utils';

export function MySchedule() {
  const { user } = useAuth();
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());

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

  const loadData = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      const startDate = weekDates[0].toISOString().split('T')[0];
      const endDate = weekDates[6].toISOString().split('T')[0];

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
  }, [user, weekDates]);

  useEffect(() => {
    loadData();
  }, [loadData]);

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

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  // Get today's shift
  const today = new Date().toISOString().split('T')[0];
  const todayShift = getShiftForDate(today);
  const todayHoliday = getHolidayForDate(today);
  const todayLeave = getLeaveForDate(today);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">My Schedule</h2>
          <p className="text-muted-foreground">
            View your weekly shift schedule
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

      {/* Weekly Calendar */}
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
            <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
              {weekDates.map((date, idx) => {
                const dateStr = date.toISOString().split('T')[0];
                const shift = getShiftForDate(dateStr);
                const holiday = getHolidayForDate(dateStr);
                const leave = getLeaveForDate(dateStr);
                const isTodayDate = isToday(date);

                return (
                  <Card
                    key={idx}
                    className={cn(
                      'min-h-[150px]',
                      isTodayDate && 'border-primary border-2',
                      holiday && 'bg-yellow-50 dark:bg-yellow-900/10',
                      leave && 'bg-blue-50 dark:bg-blue-900/10'
                    )}
                  >
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">
                        {dayNames[date.getDay()]}
                      </CardTitle>
                      <CardDescription className="text-xs">
                        {date.getDate()} {date.toLocaleDateString('en-US', { month: 'short' })}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {holiday ? (
                        <div className="space-y-2">
                          <Badge variant="outline" className="bg-yellow-100 dark:bg-yellow-900/30">
                            Holiday
                          </Badge>
                          <p className="text-xs font-medium">{holiday.name}</p>
                        </div>
                      ) : leave ? (
                        <div className="space-y-2">
                          <Badge variant="outline" className="bg-blue-100 dark:bg-blue-900/30">
                            Leave
                          </Badge>
                          <p className="text-xs text-muted-foreground">
                            {leave.type === 'SICK' ? 'Sick Leave' : leave.type === 'PERMISSION' ? 'Permission' : 'Annual Leave'}
                          </p>
                        </div>
                      ) : shift ? (
                        <div className="space-y-2">
                          <Badge
                            variant={
                              shift.status === 'COMPLETED'
                                ? 'default'
                                : shift.status === 'ON_SHIFT' || shift.status === 'LATE'
                                ? 'secondary'
                                : 'outline'
                            }
                          >
                            {shift.status}
                          </Badge>
                          <div className="flex items-center gap-1 text-xs">
                            <Clock className="h-3 w-3 text-muted-foreground" />
                            <span className="font-medium">
                              {shift.startTime} - {shift.endTime}
                            </span>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Break: {shift.breakMinutes}m
                          </div>
                        </div>
                      ) : (
                        <div className="text-xs text-muted-foreground text-center py-4">
                          No shift
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

