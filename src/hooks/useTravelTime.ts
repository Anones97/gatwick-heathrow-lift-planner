import { useState, useCallback } from 'react';
import { calculateTravelTime, type TravelTimeResult } from '@/services/mapsService';
import { useToast } from '@/hooks/use-toast';
import { formatDurationToHoursMinutes } from '@/utils/timeFormatters';

interface UseTravelTimeResult {
  calculateTime: (origin: string, destination: string) => Promise<TravelTimeResult | null>;
  isLoading: boolean;
  error: string | null;
}

export const useTravelTime = (): UseTravelTimeResult => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const calculateTime = useCallback(async (
    origin: string,
    destination: string
  ): Promise<TravelTimeResult | null> => {
    if (!origin?.trim() || !destination?.trim()) {
      const errorMsg = 'כתובת מקור ויעד נדרשים';
      setError(errorMsg);
      toast({
        title: "שגיאה",
        description: errorMsg,
        variant: "destructive",
      });
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await calculateTravelTime(origin, destination);
      
      const formattedDuration = formatDurationToHoursMinutes(result.duration);
      toast({
        title: "חישוב הושלם בהצלחה",
        description: `זמן נסיעה: ${formattedDuration} (${result.distance})`,
      });

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'אירעה שגיאה בחישוב זמן הנסיעה';
      setError(errorMessage);
      
      toast({
        title: "שגיאה בחישוב",
        description: errorMessage,
        variant: "destructive",
      });
      
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  return {
    calculateTime,
    isLoading,
    error,
  };
};