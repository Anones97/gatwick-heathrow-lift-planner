import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface TravelTimeRequest {
  origin: string;
  destination: string;
}

interface TravelTimeResponse {
  duration: number; // in minutes
  distance: string;
  status: string;
}

const airportCoordinates = {
  gatwick: { lat: 51.148056, lng: -0.190278 },
  heathrow: { lat: 51.4700, lng: -0.4543 },
  luton: { lat: 51.8747, lng: -0.3683 },
  stansted: { lat: 51.8850, lng: 0.2350 }
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { origin, destination } = await req.json() as TravelTimeRequest;

    if (!origin || !destination) {
      throw new Error('Origin and destination are required');
    }

    const googleMapsApiKey = Deno.env.get('GOOGLE_MAPS_API_KEY');
    if (!googleMapsApiKey) {
      throw new Error('Google Maps API key not configured');
    }

    // Get coordinates for the airport
    const airportCoords = airportCoordinates[destination as keyof typeof airportCoordinates];
    if (!airportCoords) {
      throw new Error('Invalid airport destination');
    }

    const destinationString = `${airportCoords.lat},${airportCoords.lng}`;
    
    // Call Google Maps Distance Matrix API
    const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodeURIComponent(origin)}&destinations=${encodeURIComponent(destinationString)}&mode=driving&departure_time=now&traffic_model=best_guess&key=${googleMapsApiKey}`;
    
    const response = await fetch(url);
    const data = await response.json();

    console.log('Google Maps API response:', JSON.stringify(data, null, 2));

    if (data.status !== 'OK') {
      throw new Error(`Google Maps API error: ${data.status}`);
    }

    const element = data.rows[0]?.elements[0];
    if (!element || element.status !== 'OK') {
      throw new Error(`No route found: ${element?.status || 'Unknown error'}`);
    }

    const durationMinutes = Math.ceil(element.duration_in_traffic?.value / 60) || Math.ceil(element.duration?.value / 60);
    const distanceText = element.distance?.text || 'Unknown distance';

    const result: TravelTimeResponse = {
      duration: durationMinutes,
      distance: distanceText,
      status: 'success'
    };

    return new Response(
      JSON.stringify(result),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('Error in calculate-travel-time function:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        status: 'error'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})