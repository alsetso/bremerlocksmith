export interface NexTripAgency {
  agency_id: number
  agency_name: string
}

export interface NexTripRoute {
  route_id: string
  agency_id: number
  route_label: string
}

export interface NexTripDirection {
  direction_id: number
  direction_name: string
}

export interface NexTripStop {
  place_code: string
  description: string
}

export interface NexTripStopWithCoord extends NexTripStop {
  latitude: number | null
  longitude: number | null
  stop_id?: number
}

/** Map pins + route path (ordered like NexTrip stop order) */
export interface TransitStopMapPoint {
  placeCode: string
  label: string
  lat: number
  lng: number
}
