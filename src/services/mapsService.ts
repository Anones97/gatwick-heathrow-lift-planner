import { supabase } from "@/integrations/supabase/client";

export interface TravelTimeResult {
  duration: number; // in minutes
  distance: string;
  status: string;
}

export interface TravelTimeError {
  error: string;
  status: string;
}

export const calculateTravelTime = async (
  origin: string,
  destination: string
): Promise<TravelTimeResult> => {
  try {
    // Validate inputs
    if (!origin?.trim()) {
      throw new Error('Origin address is required');
    }
    
    if (!destination?.trim()) {
      throw new Error('Destination airport is required');
    }

    // Sanitize inputs
    const sanitizedOrigin = origin.trim().substring(0, 200); // Limit length
    const sanitizedDestination = destination.trim();

    const { data, error } = await supabase.functions.invoke('calculate-travel-time', {
      body: {
        origin: sanitizedOrigin,
        destination: sanitizedDestination,
      },
    });

    if (error) {
      console.error('Supabase function error:', error);
      throw new Error(`Failed to calculate travel time: ${error.message}`);
    }

    if (data.status === 'error') {
      throw new Error(data.error || 'Unknown error occurred');
    }

    return data as TravelTimeResult;
  } catch (error) {
    console.error('Maps service error:', error);
    throw error;
  }
};