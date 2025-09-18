import React, { useEffect, useRef, useState } from 'react';
import { GoogleMap, useJsApiLoader } from '@react-google-maps/api';

interface Props {
  onPolygonComplete: (polygon: Array<{ lat: number; lng: number }>) => void;
  initialPolygon?: Array<{ lat: number; lng: number }> | null;
  disabled?: boolean;
}

const AreaPolygonEditor: React.FC<Props> = ({ 
  onPolygonComplete, 
  initialPolygon = null,
  disabled = false 
}) => {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: 'AIzaSyCt4x1Zu_Cgtfdu8Tst65C871kVabm4ZCk',
    libraries: ['places', 'drawing'],
  });

  const mapRef = useRef<google.maps.Map | null>(null);
  const polygonRef = useRef<google.maps.Polygon | null>(null);
  const drawingManagerRef = useRef<google.maps.drawing.DrawingManager | null>(null);
  const [polygonPoints, setPolygonPoints] = useState<Array<{ lat: number; lng: number }>>([]);
  const [error, setError] = useState<string | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  const onMapLoad = (map: google.maps.Map) => {
    console.log('Map loaded successfully');
    mapRef.current = map;
    setMapLoaded(true);
    setError(null);
    
    // Initialize Drawing Manager
    const drawingManager = new window.google.maps.drawing.DrawingManager({
      drawingMode: window.google.maps.drawing.OverlayType.POLYGON,
      drawingControl: true,
      drawingControlOptions: {
        position: window.google.maps.ControlPosition.TOP_CENTER,
        drawingModes: [
          window.google.maps.drawing.OverlayType.POLYGON
        ]
      },
      polygonOptions: {
        fillColor: '#FF0000',
        fillOpacity: 0.3,
        strokeWeight: 2,
        strokeColor: '#FF0000',
        clickable: true,
        editable: true
      }
    });

    drawingManager.setMap(map);
    drawingManagerRef.current = drawingManager;

    // Listen for polygon complete event
    window.google.maps.event.addListener(drawingManager, 'polygoncomplete', (polygon: google.maps.Polygon) => {
      // Remove previous polygon if exists
      if (polygonRef.current) {
        polygonRef.current.setMap(null);
      }
      
      polygonRef.current = polygon;
      
      // Get polygon coordinates
      const path = polygon.getPath();
      const points: Array<{ lat: number; lng: number }> = [];
      
      for (let i = 0; i < path.getLength(); i++) {
        const vertex = path.getAt(i);
        points.push({
          lat: vertex.lat(),
          lng: vertex.lng()
        });
      }
      
      setPolygonPoints(points);
      onPolygonComplete(points);
    });
    
    // If there's an initial polygon, draw it
    if (initialPolygon && initialPolygon.length >= 3) {
      try {
        const polygon = new window.google.maps.Polygon({
          paths: initialPolygon,
          fillColor: '#FF0000',
          fillOpacity: 0.3,
          strokeWeight: 2,
          strokeColor: '#FF0000',
          clickable: true,
          editable: !disabled,
          map: map
        });
        
        polygonRef.current = polygon;
        setPolygonPoints(initialPolygon);
        
        // Adjust map to show the polygon
        const bounds = new window.google.maps.LatLngBounds();
        initialPolygon.forEach(point => {
          bounds.extend({ lat: point.lat, lng: point.lng });
        });
        map.fitBounds(bounds);
      } catch (err) {
        console.error('Error drawing initial polygon:', err);
        setError('Error drawing initial polygon');
      }
    }
  };

  // Clear polygon when disabled
  useEffect(() => {
    if (disabled && polygonRef.current) {
      polygonRef.current.setMap(null);
      polygonRef.current = null;
    }
  }, [disabled]);

  if (loadError) {
    return <div style={{ color: 'red', padding: '20px' }}>Error loading Google Maps: {loadError.message}</div>;
  }

  if (!isLoaded) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>Loading map...</div>;
  }

  return (
    <div style={{ opacity: disabled ? 0.6 : 1, pointerEvents: disabled ? 'none' : 'auto' }}>
      <div style={{ marginBottom: '10px', padding: '10px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
        <strong>Instructions:</strong> 
        <ol style={{ margin: '10px 0', paddingLeft: '20px' }}>
          <li>Use the drawing tools in the top center of the map</li>
          <li>Click the polygon tool to start drawing</li>
          <li>Click on the map to add points to your polygon</li>
          <li>Double-click to finish drawing the polygon</li>
        </ol>
      </div>
      
      {error && (
        <div style={{ marginBottom: '10px', padding: '10px', backgroundColor: '#ffebee', color: '#c62828', borderRadius: '4px' }}>
          <strong>Error:</strong> {error}
        </div>
      )}
      
      <GoogleMap
        mapContainerStyle={{ width: '100%', height: 500 }}
        center={{ lat: 27.9506, lng: -82.4572 }}
        zoom={12}
        onLoad={onMapLoad}
        options={{
          zoomControl: true,
          streetViewControl: false,
          mapTypeControl: true,
          fullscreenControl: true,
          scrollwheel: true,
        }}
      />
      
      <div style={{ marginTop: '10px', fontSize: '12px', color: '#666' }}>
        <div>Map loaded: {mapLoaded ? '✓' : '⏳'}</div>
        <div>Drawing tools: {mapLoaded ? '✓ Available' : '⏳ Loading'}</div>
        <div>Points added: {polygonPoints.length}</div>
        {polygonPoints.length > 0 && (
          <div style={{ color: 'green' }}>Polygon created with {polygonPoints.length} points</div>
        )}
      </div>
    </div>
  );
};

export default AreaPolygonEditor; 