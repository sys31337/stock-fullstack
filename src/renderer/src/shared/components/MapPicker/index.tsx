import { useEffect, useRef, useState } from 'react';
import { Button } from '@web/shared/components/ui/button';
import { Loader2, MapPin, X } from 'lucide-react';
import { t } from 'i18next';
import { loadGoogleMaps } from '@web/shared/utils/googleMaps';
import { matchPlaceComponents } from '@web/shared/utils/place';

// Algeria bounding box (used to keep the map focused on Algeria only)
const ALGERIA_BOUNDS = {
  south: 18.9,
  west: -8.7,
  north: 37.1,
  east: 12.0,
};

export interface MapPickResult {
  address: string;
  lat: number;
  lng: number;
  wilayaCode?: string;
  baladiyaName?: string;
}

interface MapPickerProps {
  apiKey: string;
  /** Controlled marker position (updates pan/marker live when it changes). */
  lat?: number;
  lng?: number;
  onPick: (result: MapPickResult) => void;
  onClose?: () => void;
  /** Disable map interaction (e.g. while the address dropdown is open). */
  interactive?: boolean;
}

const isValidCoordinate = (v: any): v is number =>
  typeof v === 'number' && !isNaN(v) && v !== 0;

const MapPicker: React.FC<MapPickerProps> = ({ apiKey, lat, lng, onPick, onClose, interactive = true }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const geocoderRef = useRef<any>(null);

  // Initialize the map once.
  useEffect(() => {
    let cancelled = false;
    const fail = (message: string) => {
      if (!cancelled) {
        setError(message);
        setLoading(false);
      }
    };

    const g = (window as any);
    // Google Maps fires this callback when the API key is blocked by restrictions
    // (ApiTargetBlockedMapError / ApiReferrerBlockedMapError etc.).
    g.gm_authFailure = () => {
      fail(t('mapsKeyRestricted'));
    };

    loadGoogleMaps(apiKey)
      .then((ok) => {
        if (cancelled) return;
        if (!ok) {
          fail(t('mapsKeyRestricted'));
          return;
        }
        if (!g.google?.maps?.Map || !containerRef.current) {
          fail(t('mapsKeyRestricted'));
          return;
        }
        try {
          const bounds = new g.google.maps.LatLngBounds(
            { lat: ALGERIA_BOUNDS.south, lng: ALGERIA_BOUNDS.west },
            { lat: ALGERIA_BOUNDS.north, lng: ALGERIA_BOUNDS.east }
          );
          const hasPosition = isValidCoordinate(lat) && isValidCoordinate(lng);
          const initialCenter = hasPosition ? { lat, lng } : { lat: 28.0, lng: 2.5 };
          const map = new g.google.maps.Map(containerRef.current, {
            center: initialCenter,
            zoom: hasPosition ? 9 : 5,
            restriction: {
              latLngBounds: bounds,
              strictBounds: true,
            },
            mapTypeControl: false,
            fullscreenControl: false,
            streetViewControl: false,
          });
          mapRef.current = map;
          geocoderRef.current = new g.google.maps.Geocoder();

          const marker = new g.google.maps.Marker({
            position: initialCenter,
            map,
            draggable: true,
          });
          markerRef.current = marker;

          const handlePosition = (positionLat: number, positionLng: number) => {
            geocoderRef.current.geocode({ location: { lat: positionLat, lng: positionLng } }, (results: any[], status: string) => {
              if (status === 'OK' && results?.[0]) {
                const place = results[0];
                const address = place.formatted_address || '';
                const matched = matchPlaceComponents(place.address_components);
                onPick({ address, lat: positionLat, lng: positionLng, ...matched });
              } else {
                onPick({ address: '', lat: positionLat, lng: positionLng });
              }
            });
          };

          map.addListener('click', (e: any) => {
            marker.setPosition(e.latLng);
            handlePosition(e.latLng.lat(), e.latLng.lng());
          });
          marker.addListener('dragend', () => {
            const pos = marker.getPosition();
            handlePosition(pos.lat(), pos.lng());
          });

          setLoading(false);

          // Re-layout after the modal animation settles: fixes fuzzy/low-res tiles
          // when the map mounts inside a transformed/animated container.
          const fixLayout = () => {
            try {
              g.google.maps.event.trigger(map, 'resize');
              map.setCenter(map.getCenter());
            } catch {
              /* noop */
            }
          };
          window.setTimeout(fixLayout, 80);
          window.setTimeout(fixLayout, 400);
        } catch (err) {
          fail(t('mapsKeyRestricted'));
        }
      })
      .catch(() => {
        fail(t('mapsLoadError'));
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiKey]);

  // Sync the marker/pan when the controlled position changes (e.g. autocomplete selection).
  useEffect(() => {
    const map = mapRef.current;
    const marker = markerRef.current;
    if (!map || !marker || !isValidCoordinate(lat) || !isValidCoordinate(lng)) return;
    const pos = marker.getPosition();
    if (pos && Math.abs(pos.lat() - lat) < 1e-7 && Math.abs(pos.lng() - lng) < 1e-7) return;
    marker.setPosition({ lat, lng });
    map.panTo({ lat, lng });
  }, [lat, lng]);

  return (
    <div className="rounded-xl border border-border overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 bg-muted/40 border-b border-border">
        <span className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
          <MapPin className="h-3.5 w-3.5" />
          {t('pickAddressFromMap')}
        </span>
        {onClose && (
          <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={onClose}>
            <X className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
      <div className="relative h-64 w-full">
        <div
          ref={containerRef}
          className="h-full w-full"
          style={{ minHeight: 256, transform: 'translateZ(0)', pointerEvents: interactive ? 'auto' : 'none' }}
        />
        {loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-muted/40 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-xs">{t('loadingMap')}...</span>
          </div>
        )}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 p-4">
            <p className="text-xs text-center text-muted-foreground">{error}</p>
          </div>
        )}
      </div>
      <div className="px-3 py-2 bg-muted/20 border-t border-border text-[11px] text-muted-foreground">
        {t('mapPickHint')}
      </div>
    </div>
  );
};

export default MapPicker;