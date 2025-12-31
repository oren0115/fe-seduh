import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Timer, Wifi, WifiOff, Clock, LogIn, LogOut, AlertCircle, Bell, History } from 'lucide-react';
import { format } from 'date-fns';
import type { Shift } from '@/types/shift.types';
interface User {
  _id: string;
  name: string;
  email: string;
  role: 'OWNER' | 'KASIR';
  isActive?: boolean;
}

interface ShiftStatusBarProps {
  user: User | null;
  activeShift: Shift | null;
  isOnline: boolean;
  currentTime: Date;
  shiftTimeRemaining: { hours: number; minutes: number; totalMinutes: number } | null;
  checkInLoading: boolean;
  checkOutLoading: boolean;
  onCheckIn: () => void;
  onCheckOut: () => void;
}

export function ShiftStatusBar({
  user,
  activeShift,
  isOnline,
  currentTime,
  shiftTimeRemaining,
  checkInLoading,
  checkOutLoading,
  onCheckIn,
  onCheckOut,
}: ShiftStatusBarProps) {
  return (
    <>
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 p-4 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {/* User Avatar */}
            <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 border-2 border-primary/20">
              <span className="text-xl font-bold text-primary">
                {user?.name?.charAt(0).toUpperCase() || 'K'}
              </span>
            </div>
            
            <div className="flex-1">
              <h1 className="text-xl font-bold">{user?.name || 'Kasir'}</h1>
              <div className="flex items-center gap-3 mt-1.5">
                {activeShift ? (
                  <>
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800 font-semibold">
                      <Timer className="h-3.5 w-3.5 mr-1" />
                      Shift Active
                    </Badge>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{activeShift.startTime} - {activeShift.endTime}</span>
                      {activeShift.checkInTime && (
                        <span className="text-muted-foreground/70">
                          • Checked in: {format(new Date(activeShift.checkInTime), 'HH:mm')}
                        </span>
                      )}
                      {activeShift.isLate && (
                        <Badge variant="destructive" className="text-xs py-0">
                          Late {activeShift.lateMinutes}m
                        </Badge>
                      )}
                    </div>
                    {shiftTimeRemaining && (
                      <p className="text-xs text-muted-foreground">
                        {shiftTimeRemaining.hours}h {shiftTimeRemaining.minutes}m remaining
                      </p>
                    )}
                  </>
                ) : (
                  <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-800">
                    No active shift
                  </Badge>
                )}
                
                {/* Online/Offline Status */}
                <div className="flex items-center gap-2">
                  {isOnline ? (
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800">
                      <Wifi className="h-3.5 w-3.5 mr-1" />
                      Online
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800">
                      <WifiOff className="h-3.5 w-3.5 mr-1" />
                      Offline
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Notifications */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full border-2 border-background" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p>Notifications</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            {/* Transaction History */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <History className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p>Transaction History</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            {/* Clock with Date */}
            <div className="flex flex-col items-end text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span className="font-medium">{format(currentTime, 'HH:mm:ss')}</span>
              </div>
              <span className="text-xs text-muted-foreground/70">
                {format(currentTime, 'EEEE, MMM d, yyyy')}
              </span>
            </div>
            
            {/* Check In/Out Button */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  {!activeShift ? (
                    <Button
                      onClick={onCheckIn}
                      disabled={checkInLoading}
                      className="bg-green-600 hover:bg-green-700 h-11 px-6 text-base font-semibold"
                      size="lg"
                    >
                      <LogIn className="h-5 w-5 mr-2" />
                      {checkInLoading ? 'Checking In...' : 'Check In'}
                    </Button>
                  ) : (
                    <Button
                      onClick={onCheckOut}
                      disabled={checkOutLoading}
                      variant="destructive"
                      className="h-11 px-6 text-base font-semibold"
                      size="lg"
                    >
                      <LogOut className="h-5 w-5 mr-2" />
                      {checkOutLoading ? 'Checking Out...' : 'Check Out'}
                    </Button>
                  )}
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p>{!activeShift ? 'Start your shift to begin processing transactions' : 'End your shift and view summary'}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <ThemeToggle />
          </div>
        </div>
      </div>

      {!isOnline && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border-b border-yellow-200 dark:border-yellow-800 px-4 py-2">
          <div className="flex items-center gap-2 text-sm text-yellow-700 dark:text-yellow-400">
            <AlertCircle className="h-4 w-4" />
            <span>You are offline. Transactions will be synced when connection is restored.</span>
          </div>
        </div>
      )}
    </>
  );
}

