/**
 * Shared loader for the Google Maps JavaScript API.
 * Also used by the address autocomplete (Places). Returns true once
 * google.maps is fully available for the given key.
 */

let scriptPromise: Promise<boolean> | null = null;

export function loadGoogleMaps(apiKey: string): Promise<boolean> {
  if (typeof window === 'undefined') return Promise.resolve(false);
  const w = window as any;
  if (w.google?.maps?.Map) return Promise.resolve(true);
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise<boolean>((resolve) => {
    // Remove a previous failed/incomplete script so it can be retried.
    document.getElementById('google-maps-script')?.remove();
    const script = document.createElement('script');
    script.id = 'google-maps-script';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&libraries=places&region=DZ&v=weekly`;
    script.async = true;
    script.defer = true;
    script.addEventListener('load', () => {
      // The script may load while the API is blocked (e.g. key restrictions).
      if (!w.google?.maps?.Map) {
        scriptPromise = null;
        resolve(false);
        return;
      }
      resolve(true);
    });
    script.addEventListener('error', () => {
      scriptPromise = null;
      resolve(false);
    });
    document.head.appendChild(script);
  });
  return scriptPromise;
}