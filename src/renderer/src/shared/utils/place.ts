import { WILAYAS } from '@web/config/wilayas';

interface AddressComponent {
  long_name?: string;
  short_name?: string;
  types?: string[];
}

export interface PlaceGeoMatch {
  wilayaCode?: string;
  baladiyaName?: string;
}

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // strip accents
    .replace(/[''`]/g, '')
    .trim();
}

/**
 * Best-effort extraction of the Algerian wilaya (ADM1) and baladiya/commune
 * (locality) from a Google place / geocode result's address components.
 */
export function matchPlaceComponents(components?: AddressComponent[]): PlaceGeoMatch {
  const result: PlaceGeoMatch = {};

  const level1 = (components || []).find(
    (c) => c.types && c.types.includes('administrative_area_level_1')
  );
  if (level1?.long_name) {
    const name = normalize(level1.long_name);
    const match = WILAYAS.find(
      (w) => normalize(w.fr) === name || w.ar === level1.long_name
    );
    if (match) result.wilayaCode = match.code;
  }

  // In Algeria, the "locality" of a geocoded place is usually the commune/baladiya.
  const locality = (components || []).find(
    (c) => c.types && c.types.includes('locality')
  );
  if (locality?.long_name) {
    const wilaya = WILAYAS.find((w) => w.code === result.wilayaCode);
    const commune = (wilaya?.baladiyas || []).find(
      (b) =>
        normalize(b.fr) === normalize(locality.long_name || '') ||
        b.ar === locality.long_name
    );
    if (commune) result.baladiyaName = commune.fr;
  }

  return result;
}