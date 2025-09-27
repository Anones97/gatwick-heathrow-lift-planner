import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from "@/integrations/supabase/client";
import { MapPin, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AddressPrediction {
  description: string;
  place_id: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
}

interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  className?: string;
}

const AddressAutocomplete: React.FC<AddressAutocompleteProps> = ({
  value,
  onChange,
  placeholder = "הזן כתובת, שם מלון או מיקוד",
  label = "כתובת מלון או מיקוד",
  className = ""
}) => {
  const [predictions, setPredictions] = useState<AddressPrediction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Debounced search
  useEffect(() => {
    const searchAddresses = async () => {
      if (!value.trim() || value.trim().length < 2) {
        setPredictions([]);
        setShowDropdown(false);
        return;
      }

      setIsLoading(true);
      try {
        const { data, error } = await supabase.functions.invoke('search-addresses', {
          body: {
            input: value.trim(),
            countryCode: 'gb'
          },
        });

        if (error) {
          console.error('Address search error:', error);
          return;
        }

        if (data.status === 'OK' && data.predictions) {
          setPredictions(data.predictions);
          setShowDropdown(true);
        } else if (data.status === 'ZERO_RESULTS') {
          setPredictions([]);
          setShowDropdown(false);
        }
      } catch (error) {
        console.error('Address search error:', error);
        toast({
          title: "שגיאה בחיפוש",
          description: "לא ניתן לחפש כתובות כרגע",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    const timeoutId = setTimeout(searchAddresses, 300); // Debounce 300ms
    return () => clearTimeout(timeoutId);
  }, [value, toast]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown || predictions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < predictions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : predictions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < predictions.length) {
          selectPrediction(predictions[selectedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setShowDropdown(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const selectPrediction = (prediction: AddressPrediction) => {
    onChange(prediction.description);
    setPredictions([]);
    setShowDropdown(false);
    setSelectedIndex(-1);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`relative space-y-2 ${className}`}>
      <Label className="text-london-navy font-medium">
        {label}
      </Label>
      
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-london-navy/40 w-4 h-4" />
          <Input
            ref={inputRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              if (predictions.length > 0) {
                setShowDropdown(true);
              }
            }}
            className="bg-white border-london-grey focus:border-london-blue pl-10"
            placeholder={placeholder}
            autoComplete="off"
          />
        </div>

        {showDropdown && predictions.length > 0 && (
          <div 
            ref={dropdownRef}
            className="absolute z-50 w-full mt-1 bg-white border border-london-grey rounded-md shadow-lg max-h-60 overflow-auto"
          >
            {predictions.map((prediction, index) => (
              <div
                key={prediction.place_id}
                className={`px-4 py-3 cursor-pointer hover:bg-london-blue/10 border-b border-london-grey/20 last:border-b-0 ${
                  selectedIndex === index ? 'bg-london-blue/10' : ''
                }`}
                onClick={() => selectPrediction(prediction)}
              >
                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-london-navy/60 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-london-navy text-sm">
                      {prediction.structured_formatting.main_text}
                    </div>
                    <div className="text-london-navy/60 text-xs mt-0.5 truncate">
                      {prediction.structured_formatting.secondary_text}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {isLoading && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-london-grey rounded-md shadow-lg">
            <div className="px-4 py-3 text-london-navy/60 text-sm">
              מחפש כתובות...
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AddressAutocomplete;