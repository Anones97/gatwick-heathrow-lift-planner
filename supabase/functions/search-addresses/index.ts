import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface AddressSearchRequest {
  input: string;
  countryCode?: string;
}

interface AddressPrediction {
  description: string;
  place_id: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
}

interface AddressSearchResponse {
  predictions: AddressPrediction[];
  status: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { input, countryCode = 'gb' } = await req.json() as AddressSearchRequest;

    if (!input?.trim() || input.trim().length < 2) {
      return new Response(
        JSON.stringify({ 
          predictions: [], 
          status: 'INVALID_REQUEST' 
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        },
      )
    }

    const googleMapsApiKey = Deno.env.get('GOOGLE_MAPS_API_KEY');
    if (!googleMapsApiKey) {
      throw new Error('Google Maps API key not configured');
    }

    // Sanitize input
    const sanitizedInput = input.trim().substring(0, 200);
    
    // Call Google Places Autocomplete API
    const url = new URL('https://maps.googleapis.com/maps/api/place/autocomplete/json');
    url.searchParams.set('input', sanitizedInput);
    url.searchParams.set('components', `country:${countryCode}`);
    url.searchParams.set('language', 'en');
    url.searchParams.set('key', googleMapsApiKey);
    
    console.log('Calling Google Places API with input:', sanitizedInput);
    
    const response = await fetch(url.toString());
    const data = await response.json();

    console.log('Google Places API response status:', data.status);

    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      console.error('Google Places API error:', data.status, data.error_message);
      throw new Error(`Google Places API error: ${data.status}`);
    }

    const result: AddressSearchResponse = {
      predictions: data.predictions || [],
      status: data.status
    };

    return new Response(
      JSON.stringify(result),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('Error in search-addresses function:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return new Response(
      JSON.stringify({ 
        predictions: [],
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