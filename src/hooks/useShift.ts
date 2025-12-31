import { useState, useEffect, useCallback, useMemo } from 'react';
import { shiftService } from '@/services/shift.service';
import type { Shift, CheckOutResult } from '@/types/shift.types';
import { useToast } from '@/hooks/use-toast';

export function useShift(userId?: string) {
  const [activeShift, setActiveShift] = useState<Shift | null>(null);
  const [checkInLoading, setCheckInLoading] = useState(false);
  const [checkOutLoading, setCheckOutLoading] = useState(false);
  const [checkOutResult, setCheckOutResult] = useState<CheckOutResult | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const { toast } = useToast();

  // Real-time clock
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const loadActiveShift = useCallback(async () => {
    if (!userId) return;
    try {
      const response = await shiftService.getActive();
      setActiveShift(response.data || null);
    } catch (error) {
      console.error('Failed to load active shift:', error);
      setActiveShift(null);
    }
  }, [userId]);

  useEffect(() => {
    loadActiveShift();
    const interval = setInterval(loadActiveShift, 30000);
    return () => clearInterval(interval);
  }, [loadActiveShift]);

  const checkIn = useCallback(async () => {
    try {
      setCheckInLoading(true);
      const response = await shiftService.checkIn();
      setActiveShift(response.data.shift);
      toast({
        title: response.data.isLate ? 'Checked In (Late)' : 'Checked In',
        description: response.data.message,
        variant: response.data.isLate ? 'default' : 'default',
      });
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      toast({
        variant: 'destructive',
        title: 'Check-in Failed',
        description: err.response?.data?.error || 'Failed to check in to shift',
      });
    } finally {
      setCheckInLoading(false);
    }
  }, [toast]);

  const checkOut = useCallback(async () => {
    try {
      setCheckOutLoading(true);
      const response = await shiftService.checkOut();
      setCheckOutResult(response.data);
      setActiveShift(null);
      toast({
        title: 'Checked Out',
        description: response.data.message,
      });
      return response.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      toast({
        variant: 'destructive',
        title: 'Check-out Failed',
        description: err.response?.data?.error || 'Failed to check out from shift',
      });
      throw error;
    } finally {
      setCheckOutLoading(false);
    }
  }, [toast]);

  const getShiftTimeRemaining = useMemo(() => {
    if (!activeShift || !activeShift.checkInTime) return null;
    
    const checkInTime = new Date(activeShift.checkInTime);
    const [endHour, endMin] = activeShift.endTime.split(':').map(Number);
    const endTime = new Date(checkInTime);
    endTime.setHours(endHour, endMin, 0, 0);
    
    if (endTime <= checkInTime) {
      endTime.setDate(endTime.getDate() + 1);
    }
    
    const remaining = endTime.getTime() - currentTime.getTime();
    if (remaining <= 0) return null;
    
    const hours = Math.floor(remaining / (1000 * 60 * 60));
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
    
    return { hours, minutes, totalMinutes: Math.floor(remaining / (1000 * 60)) };
  }, [activeShift, currentTime]);

  return {
    activeShift,
    checkInLoading,
    checkOutLoading,
    checkOutResult,
    checkIn,
    checkOut,
    loadActiveShift,
    getShiftTimeRemaining,
    currentTime,
  };
}

