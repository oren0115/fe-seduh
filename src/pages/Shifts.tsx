import { useAuth } from '@/contexts/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ShiftTemplateManagement } from '@/components/shift/ShiftTemplateManagement';
import { ScheduleCalendar } from '@/components/shift/ScheduleCalendar';
import { HolidayManagement } from '@/components/shift/HolidayManagement';
import { LeaveApproval } from '@/components/shift/LeaveApproval';
import { MySchedule } from '@/components/shift/MySchedule';
import { LeaveRequestForm } from '@/components/shift/LeaveRequestForm';
import {
  Calendar,
  Clock,
  CalendarRange,
  FileText,
  User,
  CalendarCheck,
} from 'lucide-react';

export default function Shifts() {
  const { user } = useAuth();

  // Owner view
  if (user?.role === 'OWNER') {
    return (
      <div className="space-y-6">

        <Tabs defaultValue="templates" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="templates" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Templates
            </TabsTrigger>
            <TabsTrigger value="schedule" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Schedule
            </TabsTrigger>
            <TabsTrigger value="holidays" className="flex items-center gap-2">
              <CalendarRange className="h-4 w-4" />
              Holidays
            </TabsTrigger>
            <TabsTrigger value="leaves" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Leave Approval
            </TabsTrigger>
          </TabsList>

          <TabsContent value="templates" className="space-y-4">
            <ShiftTemplateManagement />
          </TabsContent>

          <TabsContent value="schedule" className="space-y-4">
            <ScheduleCalendar />
          </TabsContent>

          <TabsContent value="holidays" className="space-y-4">
            <HolidayManagement />
          </TabsContent>

          <TabsContent value="leaves" className="space-y-4">
            <LeaveApproval />
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  // Kasir view
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">My Schedule & Leave</h1>
        <p className="text-muted-foreground">
          View your shift schedule and submit leave requests
        </p>
      </div>

      <Tabs defaultValue="schedule" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="schedule" className="flex items-center gap-2">
            <CalendarCheck className="h-4 w-4" />
            My Schedule
          </TabsTrigger>
          <TabsTrigger value="leave" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Leave Request
          </TabsTrigger>
        </TabsList>

        <TabsContent value="schedule" className="space-y-4">
          <MySchedule />
        </TabsContent>

        <TabsContent value="leave" className="space-y-4">
          <LeaveRequestForm />
        </TabsContent>
      </Tabs>
    </div>
  );
}
