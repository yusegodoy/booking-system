declare global {
  interface Window {
    google: typeof google;
  }
}

declare namespace google.maps {
  namespace TravelMode {
    const DRIVING: string;
    const WALKING: string;
    const BICYCLING: string;
    const TRANSIT: string;
  }

  interface LatLng {
    lat(): number;
    lng(): number;
  }

  interface LatLngBounds {
    extend(point: LatLng | LatLngLiteral): void;
  }

  interface LatLngLiteral {
    lat: number;
    lng: number;
  }

  namespace places {
    interface Autocomplete {
      bindTo(bounds: LatLngBounds | LatLngLiteral[] | LatLngLiteral): void;
      setBounds(bounds: LatLngBounds | LatLngLiteral[] | LatLngLiteral): void;
      setComponentRestrictions(restrictions: ComponentRestrictions): void;
      setFields(fields: string[]): void;
      setOptions(options: AutocompleteOptions): void;
      setTypes(types: string[]): void;
      addListener(eventName: string, handler: Function): void;
      unbindAll(): void;
      getPlace(): PlaceResult;
    }

    interface AutocompleteOptions {
      bounds?: LatLngBounds | LatLngLiteral[] | LatLngLiteral;
      componentRestrictions?: ComponentRestrictions;
      fields?: string[];
      strictBounds?: boolean;
      types?: string[];
    }

    interface ComponentRestrictions {
      country: string | string[];
    }

    interface PlaceResult {
      address_components?: GeocoderAddressComponent[];
      formatted_address?: string;
      geometry?: PlaceGeometry;
      icon?: string;
      name?: string;
      photos?: PlacePhoto[];
      place_id?: string;
      plus_code?: PlacePlusCode;
      types?: string[];
      url?: string;
      utc_offset?: number;
      vicinity?: string;
      website?: string;
    }

    interface GeocoderAddressComponent {
      long_name: string;
      short_name: string;
      types: string[];
    }

    interface PlaceGeometry {
      location?: LatLng;
      viewport?: LatLngBounds;
    }

    interface PlacePhoto {
      height: number;
      html_attributions: string[];
      width: number;
      getUrl(opts?: PhotoOptions): string;
    }

    interface PhotoOptions {
      maxHeight?: number;
      maxWidth?: number;
    }

    interface PlacePlusCode {
      compound_code?: string;
      global_code: string;
    }
  }

  class DirectionsService {
    route(request: DirectionsRequest, callback: (result: DirectionsResult | null, status: DirectionsStatus) => void): void;
  }

  interface DirectionsRequest {
    origin: string | LatLng | LatLngLiteral;
    destination: string | LatLng | LatLngLiteral;
    waypoints?: DirectionsWaypoint[];
    optimizeWaypoints?: boolean;
    travelMode: TravelMode;
  }

  interface DirectionsWaypoint {
    location: string | LatLng | LatLngLiteral;
    stopover?: boolean;
  }

  interface DirectionsResult {
    routes: DirectionsRoute[];
  }

  interface DirectionsRoute {
    legs: DirectionsLeg[];
    overview_path: LatLng[];
    bounds: LatLngBounds;
  }

  interface DirectionsLeg {
    distance: Distance;
    duration: Duration;
    start_address: string;
    end_address: string;
    start_location: LatLng;
    end_location: LatLng;
    steps: DirectionsStep[];
  }

  interface Distance {
    text: string;
    value: number;
  }

  interface Duration {
    text: string;
    value: number;
  }

  interface DirectionsStep {
    distance: Distance;
    duration: Duration;
    instructions: string;
    path: LatLng[];
  }

  enum DirectionsStatus {
    INVALID_REQUEST = 'INVALID_REQUEST',
    MAX_WAYPOINTS_EXCEEDED = 'MAX_WAYPOINTS_EXCEEDED',
    NOT_FOUND = 'NOT_FOUND',
    OK = 'OK',
    OVER_QUERY_LIMIT = 'OVER_QUERY_LIMIT',
    REQUEST_DENIED = 'REQUEST_DENIED',
    UNKNOWN_ERROR = 'UNKNOWN_ERROR',
    ZERO_RESULTS = 'ZERO_RESULTS'
  }

  class Geocoder {
    geocode(request: GeocoderRequest, callback: (results: GeocoderResult[] | null, status: GeocoderStatus) => void): void;
  }

  interface GeocoderRequest {
    address?: string;
    bounds?: LatLngBounds | LatLngLiteral[] | LatLngLiteral;
    componentRestrictions?: GeocoderComponentRestrictions;
    location?: LatLng | LatLngLiteral;
    placeId?: string;
    region?: string;
  }

  interface GeocoderComponentRestrictions {
    administrativeArea?: string;
    country?: string;
    locality?: string;
    postalCode?: string;
    route?: string;
  }

  interface GeocoderResult {
    address_components: GeocoderAddressComponent[];
    formatted_address: string;
    geometry: GeocoderGeometry;
    partial_match?: boolean;
    place_id: string;
    postcode_localities?: string[];
    types: string[];
  }

  interface GeocoderGeometry {
    bounds?: LatLngBounds;
    location: LatLng;
    location_type: GeocoderLocationType;
    viewport: LatLngBounds;
  }

  enum GeocoderLocationType {
    APPROXIMATE = 'APPROXIMATE',
    GEOMETRIC_CENTER = 'GEOMETRIC_CENTER',
    RANGE_INTERPOLATED = 'RANGE_INTERPOLATED',
    ROOFTOP = 'ROOFTOP'
  }

  enum GeocoderStatus {
    ERROR = 'ERROR',
    INVALID_REQUEST = 'INVALID_REQUEST',
    OK = 'OK',
    OVER_QUERY_LIMIT = 'OVER_QUERY_LIMIT',
    REQUEST_DENIED = 'REQUEST_DENIED',
    UNKNOWN_ERROR = 'UNKNOWN_ERROR',
    ZERO_RESULTS = 'ZERO_RESULTS'
  }
} 