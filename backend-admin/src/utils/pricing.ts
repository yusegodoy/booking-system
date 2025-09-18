function isPointInPolygon(point: { lat: number; lng: number }, polygon: Array<{ lat: number; lng: number }>): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].lat, yi = polygon[i].lng;
    const xj = polygon[j].lat, yj = polygon[j].lng;
    const intersect = ((yi > point.lng) !== (yj > point.lng)) &&
      (point.lat < (xj - xi) * (point.lng - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

export function calculateRidePrice(
  pickup: { lat: number; lng: number; city?: string; zipcode?: string },
  dropoff: { lat: number; lng: number; city?: string; zipcode?: string },
  vehicle: any,
  pricePerMile: number,
  distance: number,
  areas: any[]
): number {
  for (const areaPrice of vehicle.areaPrices) {
    const area = areas.find(a => a._id.equals(areaPrice.area));
    if (!area) continue;
    if (area.type === 'city') {
      if (pickup.city === area.value || dropoff.city === area.value) return areaPrice.fixedPrice;
    } else if (area.type === 'zipcode') {
      if (pickup.zipcode === area.value || dropoff.zipcode === area.value) return areaPrice.fixedPrice;
    } else if (area.type === 'polygon' && area.polygon) {
      if (isPointInPolygon(pickup, area.polygon) || isPointInPolygon(dropoff, area.polygon)) return areaPrice.fixedPrice;
    }
  }
  return pricePerMile * distance;
} 