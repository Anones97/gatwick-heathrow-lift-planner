import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Clock, MapPin, Plane, Calculator, Loader2 } from 'lucide-react';
import { useTravelTime } from '@/hooks/useTravelTime';
import AddressAutocomplete from '@/components/AddressAutocomplete';
import { formatDurationToHoursMinutes, formatDurationToDecimalHours } from '@/utils/timeFormatters';

const airports = [
  { id: 'gatwick', name: 'Gatwick (LGW)', code: 'LGW' },
  { id: 'heathrow', name: 'Heathrow (LHR)', code: 'LHR' },
  { id: 'luton', name: 'Luton (LTN)', code: 'LTN' },
  { id: 'stansted', name: 'Stansted (STN)', code: 'STN' },
];

const FlightCalculator = () => {
  const [flightTime, setFlightTime] = useState('');
  const [travelDuration, setTravelDuration] = useState('');
  const [address, setAddress] = useState('');
  const [selectedAirport, setSelectedAirport] = useState('');
  const [result, setResult] = useState<{
    arrivalTime: string;
    departureTime: string;
    flightTime: string;
    travelInfo?: {
      duration: string;
      distance: string;
    };
  } | null>(null);

  const { calculateTime, isLoading } = useTravelTime();

  const calculateTimes = (flight: string, duration: string) => {
    if (!flight || !duration) return null;

    const flightDateTime = new Date(`2024-01-01T${flight}:00`);
    const durationHours = parseFloat(duration);
    
    // חישוב זמן הגעה לשדה התעופה (3 שעות לפני הטיסה)
    const arrivalDateTime = new Date(flightDateTime.getTime() - (3 * 60 * 60 * 1000));
    
    // חישוב זמן יציאה מהמלון
    const departureDateTime = new Date(arrivalDateTime.getTime() - (durationHours * 60 * 60 * 1000));

    return {
      flightTime: flightDateTime.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }),
      arrivalTime: arrivalDateTime.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }),
      departureTime: departureDateTime.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }),
    };
  };

  const handleCalculate = () => {
    const times = calculateTimes(flightTime, travelDuration);
    setResult(times);
  };

  const handleAdvancedCalculate = async () => {
    if (!address?.trim() || !selectedAirport || !flightTime) return;
    
    try {
      const travelTimeResult = await calculateTime(address.trim(), selectedAirport);
      
      if (travelTimeResult) {
        // Convert minutes to hours for calculation
        const durationHours = formatDurationToDecimalHours(travelTimeResult.duration);
        const times = calculateTimes(flightTime, durationHours);
        
        if (times) {
          const formattedDuration = formatDurationToHoursMinutes(travelTimeResult.duration);
          setResult({
            ...times,
            travelInfo: {
              duration: formattedDuration,
              distance: travelTimeResult.distance
            }
          });
        }
      }
    } catch (error) {
      console.error('Error calculating travel time:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero" dir="rtl">
      <div className="container mx-auto p-6">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            מחשבון זמני יציאה - מוניות לונדון
          </h1>
          <p className="text-white/80 text-lg mb-4">
            חישוב מדויק של זמני יציאה לשדות התעופה בלונדון
          </p>
          <div className="max-w-2xl mx-auto text-white/70 text-sm bg-white/10 backdrop-blur-sm rounded-lg p-4">
            <p>
              המחשבון עוזר לנוסעים לחשב את הזמן האידיאלי ליציאה מהמלון כדי להגיע לשדה התעופה בזמן. 
              החישוב לוקח בחשבון זמן נסיעה + 3 שעות הגעה מוקדמת לשדה התעופה.
            </p>
          </div>
        </div>

        <div className="max-w-4xl mx-auto">
          <Tabs defaultValue="basic" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 bg-white/10 backdrop-blur-sm">
              <TabsTrigger 
                value="basic" 
                className="data-[state=active]:bg-white data-[state=active]:text-london-navy text-white"
              >
                <Calculator className="w-4 h-4 ml-2" />
                מחשבון בסיסי
              </TabsTrigger>
              <TabsTrigger 
                value="advanced"
                className="data-[state=active]:bg-white data-[state=active]:text-london-navy text-white"
              >
                <MapPin className="w-4 h-4 ml-2" />
                מחשבון מתקדם
              </TabsTrigger>
            </TabsList>

            <TabsContent value="basic">
              <Card className="shadow-professional bg-gradient-card border-0">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-london-navy">
                    מחשבון זמני יציאה בסיסי
                    <Clock className="w-5 h-5" />
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="flight-time" className="text-london-navy font-medium">
                        שעת טיסה
                      </Label>
                      <Input
                        id="flight-time"
                        type="time"
                        value={flightTime}
                        onChange={(e) => setFlightTime(e.target.value)}
                        className="bg-white border-london-grey focus:border-london-blue"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="travel-duration" className="text-london-navy font-medium">
                        משך נסיעה (שעות)
                      </Label>
                      <Input
                        id="travel-duration"
                        type="number"
                        step="0.5"
                        placeholder="1.5"
                        value={travelDuration}
                        onChange={(e) => setTravelDuration(e.target.value)}
                        className="bg-white border-london-grey focus:border-london-blue"
                      />
                    </div>
                  </div>

                  <Button 
                    onClick={handleCalculate}
                    className="w-full bg-london-red hover:bg-london-red/90 text-white shadow-button"
                    disabled={!flightTime || !travelDuration}
                  >
                    חשב זמני יציאה
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="advanced">
              <Card className="shadow-professional bg-gradient-card border-0">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-london-navy">
                    מחשבון מתקדם עם חיפוש כתובות
                    <MapPin className="w-5 h-5" />
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <AddressAutocomplete
                    value={address}
                    onChange={setAddress}
                    placeholder="הזן כתובת מלון, שם מקום או מיקוד"
                    label="כתובת מלון או מיקוד"
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-london-navy font-medium">
                        שדה תעופה
                      </Label>
                      <Select value={selectedAirport} onValueChange={setSelectedAirport}>
                        <SelectTrigger className="bg-white border-london-grey">
                          <SelectValue placeholder="בחר שדה תעופה" />
                        </SelectTrigger>
                        <SelectContent>
                          {airports.map((airport) => (
                            <SelectItem key={airport.id} value={airport.id}>
                              {airport.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="flight-time-advanced" className="text-london-navy font-medium">
                        שעת טיסה
                      </Label>
                      <Input
                        id="flight-time-advanced"
                        type="time"
                        value={flightTime}
                        onChange={(e) => setFlightTime(e.target.value)}
                        className="bg-white border-london-grey focus:border-london-blue"
                      />
                    </div>
                  </div>

                  <Button 
                    onClick={handleAdvancedCalculate}
                    className="w-full bg-london-red hover:bg-london-red/90 text-white shadow-button"
                    disabled={!address?.trim() || !selectedAirport || !flightTime || isLoading}
                  >
                    {isLoading ? (
                      <>
                        מחשב זמן נסיעה...
                        <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                      </>
                    ) : (
                      "חשב זמני יציאה עם Google Maps"
                    )}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {result && (
            <Card className="mt-6 shadow-professional bg-white border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-london-navy">
                  תוצאות החישוב
                  <Plane className="w-5 h-5" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center p-4 bg-london-blue/10 rounded-lg">
                    <div className="text-2xl font-bold text-london-blue mb-1">
                      {result.departureTime}
                    </div>
                    <div className="text-sm text-london-navy/70">
                      זמן יציאה מהמלון
                    </div>
                  </div>
                  
                  <div className="text-center p-4 bg-london-gold/20 rounded-lg">
                    <div className="text-2xl font-bold text-london-navy mb-1">
                      {result.arrivalTime}
                    </div>
                    <div className="text-sm text-london-navy/70">
                      הגעה לשדה התעופה
                    </div>
                  </div>
                  
                  <div className="text-center p-4 bg-london-red/10 rounded-lg">
                    <div className="text-2xl font-bold text-london-red mb-1">
                      {result.flightTime}
                    </div>
                    <div className="text-sm text-london-navy/70">
                      זמן הטיסה
                    </div>
                  </div>
                </div>

                {result.travelInfo && (
                  <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <h4 className="font-medium text-green-800 mb-2">פרטי נסיעה מ-Google Maps:</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-green-700">זמן נסיעה:</span>
                        <span className="text-green-600 mr-2">{result.travelInfo.duration}</span>
                      </div>
                      <div>
                        <span className="font-medium text-green-700">מרחק:</span>
                        <span className="text-green-600 mr-2">{result.travelInfo.distance}</span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default FlightCalculator;