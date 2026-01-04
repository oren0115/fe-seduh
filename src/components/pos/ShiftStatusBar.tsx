import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Timer, Wifi, WifiOff, Clock, LogIn, LogOut, AlertCircle, History, MoreVertical, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import type { Shift } from '@/types/shift.types';
import { NotificationDropdown, type Notification } from '@/components/NotificationDropdown';
interface User {
  _id: string;
  name: string;
  email: string;
  role: 'OWNER' | 'KASIR' | 'BARISTA';
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
  onHistoryClick?: () => void;
  onShiftsClick?: () => void;
  onLogout?: () => void;
  notifications?: Notification[];
  onMarkNotificationAsRead?: (id: string) => void;
  onMarkAllNotificationsAsRead?: () => void;
  onClearAllNotifications?: () => void;
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
  onHistoryClick,
  onShiftsClick,
  onLogout,
  notifications = [],
  onMarkNotificationAsRead,
  onMarkAllNotificationsAsRead,
  onClearAllNotifications,
}: ShiftStatusBarProps) {
  return (
    <>
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 p-3 md:p-4 shadow-sm">
        <div className="flex items-center justify-between gap-3 md:gap-4">
          <div className="flex items-center gap-3 md:gap-4 min-w-0 flex-1">
            {/* User Avatar */}
            <div className="h-12 w-12 md:h-14 md:w-14 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 border-2 border-primary/20">
              <span className="text-lg md:text-xl font-bold text-primary">
                {user?.name?.charAt(0).toUpperCase() || 'K'}
              </span>
            </div>
            
            <div className="flex-1 min-w-0">
              <h1 className="text-lg md:text-xl font-bold truncate">{user?.name || (user?.role === 'BARISTA' ? 'Barista' : 'Kasir')}</h1>
              <div className="flex items-center gap-2 md:gap-3 mt-1.5 flex-wrap">
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
          
          <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
            {/* Notifications */}
            <NotificationDropdown
              notifications={notifications}
              onMarkAsRead={onMarkNotificationAsRead}
              onMarkAllAsRead={onMarkAllNotificationsAsRead}
              onClearAll={onClearAllNotifications}
            />
            
            {/* Shifts & Schedule */}
            {onShiftsClick && (
              <Button 
                variant="ghost" 
                size="icon"
                onClick={onShiftsClick}
                title="My Schedule & Leave"
                className="h-10 w-10 md:h-11 md:w-11"
              >
                <Calendar className="h-5 w-5" />
              </Button>
            )}
            
            {/* Transaction History */}
            <Button 
              variant="ghost" 
              size="icon"
              onClick={onHistoryClick}
              title="Transaction History"
              className="h-10 w-10 md:h-11 md:w-11"
            >
              <History className="h-5 w-5" />
            </Button>
            
            {/* Clock with Date */}
            <div className="hidden md:flex flex-col items-end text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span className="font-medium">{format(currentTime, 'HH:mm:ss')}</span>
              </div>
              <span className="text-xs text-muted-foreground/70">
                {format(currentTime, 'EEEE, MMM d, yyyy')}
              </span>
            </div>
            <div className="md:hidden flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              <span className="font-medium">{format(currentTime, 'HH:mm')}</span>
            </div>
            
            {/* Check In/Out Button */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  {!activeShift ? (
                    <Button
                      onClick={onCheckIn}
                      disabled={checkInLoading}
                      className="bg-green-600 hover:bg-green-700 h-10 md:h-11 px-4 md:px-6 text-sm md:text-base font-semibold"
                    >
                      <LogIn className="h-4 w-4 md:h-5 md:w-5 mr-1.5 md:mr-2" />
                      <span className="hidden sm:inline">{checkInLoading ? 'Checking In...' : 'Check In'}</span>
                      <span className="sm:hidden">{checkInLoading ? '...' : 'In'}</span>
                    </Button>
                  ) : (
                    <Button
                      onClick={onCheckOut}
                      disabled={checkOutLoading}
                      variant="destructive"
                      className="h-10 md:h-11 px-4 md:px-6 text-sm md:text-base font-semibold"
                    >
                      <LogOut className="h-4 w-4 md:h-5 md:w-5 mr-1.5 md:mr-2" />
                      <span className="hidden sm:inline">{checkOutLoading ? 'Checking Out...' : 'Check Out'}</span>
                      <span className="sm:hidden">{checkOutLoading ? '...' : 'Out'}</span>
                    </Button>
                  )}
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p>{!activeShift ? 'Start your shift to begin processing transactions' : 'End your shift and view summary'}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <ThemeToggle />
            
            {/* Logout Menu */}
            {onLogout && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 md:h-11 md:w-11"
                    title="Menu"
                  >
                    <MoreVertical className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={onLogout} className="text-destructive cursor-pointer focus:text-destructive">
                    <LogOut className="h-4 w-4 mr-2" />
                    <span>Logout</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
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

