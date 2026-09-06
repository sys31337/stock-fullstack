import { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Input } from '@web/shared/components/ui/input';
import { Label } from '@web/shared/components/ui/label';
import { MapPin, Loader2 } from 'lucide-react';
import { loadGoogleMaps } from '@web/shared/utils/googleMaps';
import { useGetSettings } from '@web/shared/hooks/useSettings';
import { MapPickResult } from '@web/shared/components/MapPicker';
import { matchPlaceComponents } from '@web/shared/utils/place';
import { t } from 'i18next';

// Algeria bounding box — used to bias predictions towards Algeria.
const ALGERIA_BOUNDS = {
  south: 18.9,
  west: -8.7,
  north: 37.1,
  east: 12.0,
};

interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onPlaceSelect: (result: MapPickResult) => void;
  label?: string;
  errorMessage?: string;
}

interface Prediction {
  place_id: string;
  description: string;
}

interface DropdownPos {
  top: number;
  left: number;
  width: number;
}

/**
 * Address input with Google Places predictions restricted to Algeria (DZ).
 *
 * Uses the Places AutocompleteService + a custom dropdown rendered in a portal,
 * so the suggestions are never clipped by the parent modal's overflow, and up to
 * 8 predictions are listed (double the built-in widget).
 */
const AddressAutocomplete: React.FC<AddressAutocompleteProps> = ({
  value,
  onChange,
  onPlaceSelect,
  label,
  errorMessage,
}) => {
  const { data: settings } = useGetSettings();
  const mapsApiKey = settings?.googleMapsApiKey || '';

  const inputRef = useRef<HTMLInputElement>(null);
  const serviceRef = useRef<any>(null);
  const detailsRef = useRef<any>(null);
  const sessionRef = useRef<any>(null);
  const activeIndexRef = useRef(-1);

  const [ready, setReady] = useState(false);
  const [focused, setFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [dropdownPos, setDropdownPos] = useState<DropdownPos | null>(null);
  const [activeIndex, setActiveIndex] = useState(-1);

  // Load the Maps/Places API and prepare the services once.
  useEffect(() => {
    if (!mapsApiKey) return;
    let cancelled = false;

    loadGoogleMaps(mapsApiKey).then((ok) => {
      if (cancelled) return;
      const g = (window as any)?.google;
      if (!ok || !g?.maps?.places?.AutocompleteService) return;

      serviceRef.current = new g.maps.places.AutocompleteService();
      detailsRef.current = new g.maps.places.PlacesService(document.createElement('div'));
      sessionRef.current = new g.maps.places.AutocompleteSessionToken();
      setReady(true);
    });

    return () => {
      cancelled = true;
    };
  }, [mapsApiKey]);

  // Request predictions from the Service (debounced).
  useEffect(() => {
    if (!ready || !serviceRef.current) return;
    const query = value.trim();
    if (query.length < 2) {
      setPredictions([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const timeout = window.setTimeout(() => {
      const g = (window as any)?.google;
      const bounds = new g.maps.LatLngBounds(
        { lat: ALGERIA_BOUNDS.south, lng: ALGERIA_BOUNDS.west },
        { lat: ALGERIA_BOUNDS.north, lng: ALGERIA_BOUNDS.east }
      );
      serviceRef.current.getPlacePredictions(
        {
          input: query,
          sessionToken: sessionRef.current,
          componentRestrictions: { country: 'DZ' },
          locationBias: bounds,
          // No `types` filter on purpose: addresses AND places/regions in Algeria.
        },
        (results: any[] | null, status: string) => {
          if (status !== 'OK' || !results) {
            setPredictions([]);
          } else {
            setPredictions(
              results.slice(0, 8).map((r) => ({ place_id: r.place_id, description: r.description }))
            );
          }
          setLoading(false);
          setActiveIndex(-1);
          activeIndexRef.current = -1;
        }
      );
    }, 250);

    return () => window.clearTimeout(timeout);
  }, [value, ready]);

  // Position the portal dropdown under the input.
  useEffect(() => {
    const el = inputRef.current;
    if (!el) {
      setDropdownPos(null);
      return;
    }
    const rect = el.getBoundingClientRect();
    setDropdownPos({ top: rect.bottom + 4, left: rect.left, width: rect.width });
  }, [predictions, focused, loading]);

  // Close the dropdown when clicking outside.
  useEffect(() => {
    if (!focused && predictions.length === 0) return;
    const onDocMouseDown = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      if (!t.closest('[data-address-autocomplete]')) {
        setFocused(false);
      }
    };
    document.addEventListener('mousedown', onDocMouseDown);
    return () => document.removeEventListener('mousedown', onDocMouseDown);
  }, [focused, predictions.length]);

  const resolvePlace = useCallback(
    (prediction: Prediction) => {
      const g = (window as any)?.google;
      if (detailsRef.current && g?.maps?.places?.PlacesServiceStatus) {
        detailsRef.current.getDetails(
          {
            placeId: prediction.place_id,
            fields: ['formatted_address', 'geometry', 'address_components', 'name'],
            sessionToken: sessionRef.current,
          },
          (place: any, status: string) => {
            sessionRef.current = new g.maps.places.AutocompleteSessionToken();
            if (status === 'OK' && place && place.geometry) {
              onPlaceSelect({
                address: place.formatted_address || place.name || prediction.description,
                lat: place.geometry.location.lat(),
                lng: place.geometry.location.lng(),
                ...matchPlaceComponents(place.address_components),
              });
            } else {
              // No geometry available — keep the suggestion as the address only.
              onChange(prediction.description);
            }
          }
        );
      } else {
        onChange(prediction.description);
      }
      setPredictions([]);
      setFocused(false);
      inputRef.current?.blur();
    },
    [onChange, onPlaceSelect]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!predictions.length) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const next = (activeIndexRef.current + 1) % predictions.length;
      activeIndexRef.current = next;
      setActiveIndex(next);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prev = activeIndexRef.current <= 0 ? predictions.length - 1 : activeIndexRef.current - 1;
      activeIndexRef.current = prev;
      setActiveIndex(prev);
    } else if (e.key === 'Enter') {
      if (activeIndexRef.current >= 0) {
        e.preventDefault();
        resolvePlace(predictions[activeIndexRef.current]);
      }
    } else if (e.key === 'Escape') {
      setPredictions([]);
      setFocused(false);
    }
  };

  const showDropdown = focused && (predictions.length > 0 || loading);

  return (
    <div className="w-full" data-address-autocomplete>
      {label && (
        <Label htmlFor="address" className={errorMessage ? "mb-2 block text-red-500" : "mb-2 block text-primary"}>
          {label}
        </Label>
      )}
      <Input
        id="address"
        ref={inputRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => {
          // Blur closes unless a suggestion is being picked (handled via onMouseDown).
        }}
        onKeyDown={handleKeyDown}
        placeholder={ready ? t('addressAutocompletePlaceholder') : t('address')}
        className={errorMessage ? "w-full rounded-xl border-red-500 bg-background text-foreground" : "w-full rounded-xl border-input bg-background text-foreground"}
      />
      {errorMessage && <p className="text-sm text-red-500 mt-1">{errorMessage}</p>}

      {showDropdown && dropdownPos && typeof document !== 'undefined'
        ? createPortal(
            <div
              className="fixed z-[100001] rounded-lg border bg-popover shadow-xl text-popover-foreground overflow-hidden"
              style={{ top: dropdownPos.top, left: dropdownPos.left, width: dropdownPos.width }}
              onMouseDown={(e) => e.preventDefault() /* keep input focus while clicking */}
            >
              {loading && (
                <div className="flex items-center gap-2 px-3 py-2.5 text-xs text-muted-foreground">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  {t('loadingMap')}...
                </div>
              )}
              {!loading && predictions.length === 0 && (
                <div className="px-3 py-2.5 text-xs text-muted-foreground">{t('noAddressResults')}</div>
              )}
              {!loading &&
                predictions.map((p, i) => (
                  <button
                    key={p.place_id}
                    type="button"
                    onMouseEnter={() => {
                      activeIndexRef.current = i;
                      setActiveIndex(i);
                    }}
                    onClick={() => resolvePlace(p)}
                    className={`w-full text-left flex items-start gap-2 px-3 py-2 text-xs transition-colors ${i === activeIndex ? 'bg-accent' : 'hover:bg-accent/60'}`}
                  >
                    <MapPin className="h-3.5 w-3.5 mt-0.5 shrink-0 text-muted-foreground" />
                    <span className="line-clamp-2">{p.description}</span>
                  </button>
                ))}
            </div>,
            document.body
          )
        : null}
    </div>
  );
};

export default AddressAutocomplete;