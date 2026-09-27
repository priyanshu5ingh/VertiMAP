import React, { useState, useEffect, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import axios from 'axios';
import './MapView.css';

// Helper to convert lat/long to 3D coordinates on a sphere
const latLongToVector3 = (lat, lng, radius) => {
  const phi = ((90 - lat) * Math.PI) / 180;
  const theta = ((lng + 180) * Math.PI) / 180;
  const x = radius * Math.sin(phi) * Math.cos(theta);
  const y = radius * Math.cos(phi);
  const z = radius * Math.sin(phi) * Math.sin(theta);
  return { x, y, z };
};

// Helper to parse WKT POLYGON
const parseWKTPolygon = (wkt) => {
  if (!wkt || !wkt.startsWith('POLYGON')) return [];

  // Extract coordinates from POLYGON((...))
  const match = wkt.match(/POLYGON\(\((.*)\)\)/);
  if (!match) return [];

  const coordsStr = match[1];
  // Split by comma and parse each coordinate pair
  const pairs = coordsStr.split(',').map(pair => pair.trim().split(' '));
  return pairs.map(pair => ({
    lng: parseFloat(pair[0]),
    lat: parseFloat(pair[1])
  }));
};

// Create terrain geometry
const createTerrain = (size, divisions) => {
  const geometry = new THREE.PlaneGeometry(size, size, divisions, divisions);
  // Ground elevation datum baseline
  const vertices = geometry.attributes.position.array;
  for (let i = 0; i < vertices.length; i += 3) {
    vertices[i + 2] = 0;
  }
  geometry.attributes.position.needsUpdate = true;
  geometry.computeVertexNormals();
  return geometry;
};

// Building extrusion component
const Building = ({ footprint, height, color = '#6a11cb' }) => {
  const [meshRef] = useState(() => new THREE.Mesh());

  useEffect(() => {
    if (!footprint || footprint.length < 3) return;

    // Create shape from footprint
    const shape = new THREE.Shape();
    footprint.forEach((point, index) => {
      const [lng, lat] = [point.lng, point.lat];
      // Convert WGS84 to local metric grid centered on Central Bengaluru Pilot origin (77.6035, 12.9760)
      const x = (lng - 77.6035) * 111320 * Math.cos(12.9760 * Math.PI / 180);
      const y = (lat - 12.9760) * 110574;
      if (index === 0) {
        shape.moveTo(x, y);
      } else {
        shape.lineTo(x, y);
      }
    });
    shape.closePath();

    // Extrude shape
    const extrudeSettings = {
      depth: height || 10,
      bevelEnabled: false,
      bevelSegments: 2,
      steps: 1,
      bevelSize: 1,
      bevelThickness: 1
    };

    const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    const material = new THREE.MeshStandardMaterial({
      color: color,
      metalness: 0.3,
      roughness: 0.7
    });

    meshRef.geometry = geometry;
    meshRef.material = material;
  }, [footprint, height, color]);

  return <primitive ref={meshRef} />;
};

// Measurement tool component
const MeasurementTool = ({ active, onMeasureComplete }) => {
  const [points, setPoints] = useState([]);
  const [lineRef] = useState(() => new THREE.Line());

  useEffect(() => {
    if (points.length === 2) {
      const geometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(points[0].x, points[0].y, points[0].z),
        new THREE.Vector3(points[1].x, points[1].y, points[1].z)
      ]);

      const material = new THREE.LineDashedMaterial({
        color: 0xffaa00,
        dashSize: 0.5,
        gapSize: 0.5
      });

      lineRef.geometry = geometry;
      lineRef.material = material;
      lineRef.computeLineDistances();

      // Calculate distance
      const distance = points[0].distanceTo(points[1]);
      onMeasureComplete(distance);
    }
  }, [points, onMeasureComplete]);

  const handleClick = (event) => {
    if (!active) return;
    if (event.point && points.length < 2) {
      setPoints([...points, event.point.clone()]);
    }
  };

  return (
    <>
      <primitive ref={lineRef} />
      <plane
        position={[0, 0, 0]}
        rotation={[ -Math.PI / 2, 0, 0 ]}
        args={[1000, 1000]}
        onPointerDown={handleClick}
      />
    </>
  );
};

// Slice plane component
const SlicePlane = ({ active, position, normal, onSliceUpdate }) => {
  const [meshRef] = useState(() => new THREE.Mesh());

  useEffect(() => {
    if (!active) return;

    const geometry = new THREE.PlaneGeometry(50, 50);
    const material = new THREE.MeshBasicMaterial({
      color: 0x00ffff,
      opacity: 0.3,
      transparent: true,
      side: THREE.DoubleSide
    });

    meshRef.geometry = geometry;
    meshRef.material = material;

    if (position) {
      meshRef.position.copy(new THREE.Vector3(
        position.x || 0,
        position.y || 0,
        position.z || 0
      ));
    }

    if (normal) {
      // Orient plane according to normal vector
      meshRef.rotation.x = normal.x || 0;
      meshRef.rotation.y = normal.y || 0;
      meshRef.rotation.z = normal.z || 0;
    }
  }, [active, position, normal]);

  return <primitive ref={meshRef} />;
};

const GlobeWithTerrain = ({
  parcels,
  buildings,
  mapStyle,
  measurementActive,
  onMeasurementComplete,
  sliceActive,
  slicePosition,
  sliceNormal,
  onSliceUpdate
}) => {
  // Globe/terrain mesh
  const [terrainRef] = useState(() => new THREE.Mesh());

  useEffect(() => {
    const geometry = createTerrain(100, 64);

    let material;
    if (mapStyle === 'satellite') {
      // In a real app, we'd load a satellite texture
      material = new THREE.MeshStandardMaterial({
        color: 0x228B22, // Forest green as placeholder
        metalness: 0.0,
        roughness: 0.9
      });
    } else if (mapStyle === 'terrain') {
      material = new THREE.MeshStandardMaterial({
        color: 0x8FBC8F, // Dark sea green
        metalness: 0.1,
        roughness: 0.8
      });
    } else if (mapStyle === 'night') {
      material = new THREE.MeshStandardMaterial({
        color: 0x2F2F2F, // Dark gray
        metalness: 0.3,
        roughness: 0.4
      });
    } else {
      // Default style
      material = new THREE.MeshStandardMaterial({
        color: 0x002b5c, // Dark blue from original
        metalness: 0.2,
        roughness: 0.7
      });
    }

    terrainRef.geometry = geometry;
    terrainRef.material = material;
    terrainRef.rotation.x = -Math.PI / 2; // Rotate to be horizontal
  }, [mapStyle]);

  // Parse WKT data for parcels and buildings (in a real app, this would be done more efficiently)
  const parcelMeshes = parcels
    .filter(p => p.boundary_wkt && p.centroid_lat !== null && p.centroid_lng !== null)
    .map((p, index) => {
      try {
        const coords = parseWKTPolygon(p.boundary_wkt);
        if (coords.length < 3) return null;

        const pos = latLongToVector3(p.centroid_lat, p.centroid_lng, 10.5); // Slightly above terrain

        return (
          <Building
            key={`parcel-${index}`}
            footprint={coords.map(c => ({ lng: c.lng, lat: c.lat }))}
            height={Math.max(p.elevation_max || 5, 1)}
            color="#ffd700"
          />
        );
      } catch (e) {
        console.warn('Error parsing parcel WKT:', e);
        return null;
      }
    })
    .filter(Boolean);

  const buildingMeshes = buildings
    .filter(b => b.footprint_wkt && b.height_m !== null)
    .map((b, index) => {
      try {
        const coords = parseWKTPolygon(b.footprint_wkt);
        if (coords.length < 3) return null;

        // Get centroid for positioning
        const avgLat = coords.reduce((sum, c) => sum + c.lat, 0) / coords.length;
        const avgLng = coords.reduce((sum, c) => sum + c.lng, 0) / coords.length;
        const pos = latLongToVector3(avgLat, avgLng, 10.5);

        return (
          <Building
            key={`building-${index}`}
            footprint={coords.map(c => ({ lng: c.lng, lat: c.lat }))}
            height={b.height_m || 10}
            color="#6a11cb"
          );
      } catch (e) {
        console.warn('Error parsing building WKT:', e);
        return null;
      }
    })
    .filter(Boolean);

  return (
    <>
      {/* Terrain/Globe base */}
      <mesh ref={terrainRef} rotation={[ -Math.PI / 2, 0, 0 ]} position={[0, 0, 0]}>
        {/* Geometry and material set in useEffect */}
      </mesh>

      {/* Parcels */}
      {parcelMeshes}

      {/* Buildings */}
      {buildingMeshes}

      {/* Measurement tool */}
      {measurementActive && <MeasurementTool
        active={measurementActive}
        onMeasureComplete={onMeasurementComplete}
      />}

      {/* Slice plane */}
      {sliceActive && <SlicePlane
        active={sliceActive}
        position={slicePosition}
        normal={sliceNormal}
        onSliceUpdate={onSliceUpdate}
      />}

      {/* Lights */}
      <ambientLight intensity={0.6} />
      <directionalLight position={[10, 10, 5]} intensity={0.8} />
      <hemisphereLight
        skyColor={0x00aaff}
        groundColor=0x0055aa
        intensity={0.5}
      />
    </>
  );
};

const MapView = () => {
  const [mapInitialized, setMapInitialized] = useState(false);
  const [mapStyle, setMapStyle] = useState('default');
  const [layers, setLayers] = useState({
    parcels: true,
    buildings: true,
    underground: true,
    terrain: true,
    labels: true
  });
  const [parcels, setParcels] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Measurement state
  const [measurementActive, setMeasurementActive] = useState(false);
  const [measurementResult, setMeasurementResult] = useState(null);

  // Slice tool state
  const [sliceActive, setSliceActive] = useState(false);
  const [slicePosition, setSlicePosition] = useState(null);
  const [sliceNormal, setSliceNormal] = useState({ x: 0, y: 0, z: 1 }); // Default horizontal slice

  useEffect(() => {
    // Initialize 3D map and fetch data
    const initMap = async () => {
      try {
        // Fetch parcels
        const parcelsResponse = await axios.get((process.env.REACT_APP_API_URL || 'http://localhost:8000/api/v1') + '/parcels/');
        setParcels(parcelsResponse.data);

        // Fetch buildings
        const buildingsResponse = await axios.get((process.env.REACT_APP_API_URL || 'http://localhost:8000/api/v1') + '/buildings/');
        setBuildings(buildingsResponse.data);

        setLoading(false);
      } catch (err) {
        setError('Failed to load map data');
        console.error(err);
        setLoading(false);
      }
      setMapInitialized(true);
    };

    initMap();
  }, []);

  const toggleLayer = (layer) => {
    setLayers(prev => ({
      ...prev,
      [layer]: !prev[layer]
    }));
  };

  const changeMapStyle = (style) => {
    setMapStyle(style);
  };

  const handleMeasureClick = () => {
    setMeasurementActive(!measurementActive);
    if (!measurementActive) {
      setMeasurementResult(null);
    }
  };

  const handleSliceClick = () => {
    setSliceActive(!sliceActive);
    if (!sliceActive) {
      setSlicePosition(null);
    }
  };

  const handleMeasurementComplete = (distance) => {
    setMeasurementResult(distance);
    setMeasurementActive(false);
    alert(`Measurement complete: ${distance.toFixed(2)} meters`);
  };

  const handleSliceUpdate = (position, normal) => {
    setSlicePosition(position);
    setSliceNormal(normal);
  };

  if (!mapInitialized) {
    return (
      <div className="map-view-page">
        <div className="map-view-header glass-panel">
          <div className="header-content">
            <h1>3D Property Intelligence Map</h1>
            <p className="subtitle">Explore cadastral data in three dimensions</p>
          </div>
          <div className="header-actions">
            <button
              className="btn btn-outline"
              onClick={() => changeMapStyle('satellite')}
            >
              Satellite
            </button>
            <button
              className="btn btn-outline"
              onClick={() => changeMapStyle('terrain')}
            >
              Terrain
            </button>
            <button
              className="btn btn-outline"
              onClick={() => changeMapStyle('default')}
            >
              Default
            </button>
          </div>
        </div>
        <div className="loading-container glass-panel">
          <div className="loading-spinner"></div>
          <h3>Loading 3D Map Intelligence...</h3>
          <p>Initializing advanced spatial rendering engine</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="map-view-page">
        <div className="map-view-header glass-panel">
          <div className="header-content">
            <h1>3D Property Intelligence Map</h1>
            <p className="subtitle">Explore cadastral data in three dimensions</p>
          </div>
          <div className="header-actions">
            <button
              className="btn btn-outline"
              onClick={() => changeMapStyle('satellite')}
            >
              Satellite
            </button>
            <button
              className="btn btn-outline"
              onClick={() => changeMapStyle('terrain')}
            >
              Terrain
            </button>
            <button
              className="btn btn-outline"
              onClick={() => changeMapStyle('default')}
            >
              Default
            </button>
          </div>
        </div>
        <div className="map-container">
          <div className="map-wrapper">
            <div id="map-3d" className={`map-3d ${mapStyle}`}>
              <div className="map-error">
                <h2>Error Loading Map Data</h2>
                <p>{error}</p>
                <button
                  className="btn btn-outline"
                  onClick={() => window.location.reload()}
                >
                  Retry
                </button>
              </div>
            </div>
          </div>
        </div>
      );
  }

  return (
    <div className="map-view-page">
      <div className="map-view-header glass-panel">
        <div className="header-content">
          <h1>3D Property Intelligence Map</h1>
          <p className="subtitle">Explore cadastral data in three dimensions</p>
        </div>
        <div className="header-actions">
          <button
            className="btn btn-outline"
            onClick={() => changeMapStyle('satellite')}
          >
            Satellite
          </button>
          <button
            className="btn btn-outline"
            onClick={() => changeMapStyle('terrain')}
          >
            Terrain
          </button>
          <button
            className="btn btn-outline"
            onClick={() => changeMapStyle('default')}
          >
            Default
          </button>
          <button
            className="btn btn-outline"
            onClick={() => changeMapStyle('night')}
          >
            Night
          </button>
        </div>
      </div>

      {mapInitialized && (
        <div className="map-container">
          <div className="map-wrapper">
            <div id="map-3d" className={`map-3d ${mapStyle}`}>
              <Canvas
                style={{ height: '100%', width: '100%' }}
                camera={{ position: [0, 0, 20], fov: 60 }}
                >
                <OrbitControls
                  enableZoom
                  enablePan
                  enableRotate
                  minDistance={10}
                  maxDistance={100}
                />
                <GlobeWithTerrain
                  parcels={layers.parcels ? parcels : []}
                  buildings={layers.buildings ? buildings : []}
                  mapStyle={mapStyle}
                  measurementActive={measurementActive}
                  onMeasurementComplete={handleMeasurementComplete}
                  sliceActive={sliceActive}
                  slicePosition={slicePosition}
                  sliceNormal={sliceNormal}
                  onSliceUpdate={handleSliceUpdate}
                />
              </Canvas>
            </div>
          </div>
        </div>

        <div className="map-controls">
          <div className="control-group">
            <label htmlFor="map-style">Map Style:</label>
            <select
              id="map-style"
              value={mapStyle}
              onChange={(e) => changeMapStyle(e.target.value)}
              className="glass-panel"
            >
              <option value="default">Default</option>
              <option value="satellite">Satellite</option>
              <option value="terrain">Terrain</option>
              <option value="night">Night</option>
            </select>
          </div>

          <div className="control-group">
            <label>Layers:</label>
            <div className="layer-toggles">
              <label className="layer-label">
                <input
                  type="checkbox"
                  checked={layers.parcels}
                  onChange={() => toggleLayer('parcels')}
                />
                Parcels
              </label>
              <label className="layer-label">
                <input
                  type="checkbox"
                  checked={layers.buildings}
                  onChange={() => toggleLayer('buildings')}
                />
                Buildings
              </label>
              <label className="layer-label">
                <input
                  type="checkbox"
                  checked={layers.underground}
                  onChange={() => toggleLayer('underground')}
                />
                Underground
              </label>
              <label className="layer-label">
                <input
                  type="checkbox"
                  checked={layers.terrain}
                  onChange={() => toggleLayer('terrain')}
                />
                Terrain
              </label>
              <label className="layer-label">
                <input
                  type="checkbox"
                  checked={layers.labels}
                  onChange={() => toggleLayer('labels')}
                />
                Labels
              </label>
            </div>
          </div>

          <div className="control-actions">
            <div className="measurement-section">
              <button
                className={`btn ${measurementActive ? 'btn-primary' : 'btn-outline'}`}
                onClick={handleMeasureClick}
              >
                {measurementActive ? 'Measurement: ON' : 'Measure Distance'}
              </button>
              {measurementResult !== null && (
                <div className="measurement-result">
                  Last measurement: {measurementResult.toFixed(2)} m
                </div>
              )}
            </div>

            <button
              className={`btn ${sliceActive ? 'btn-primary' : 'btn-outline'}`}
              onClick={handleSliceClick}
            >
              {sliceActive ? 'Slice Tool: ON' : 'Slice Tool'}
            </button>

            <button className="btn btn-outline" onClick={() =>
              alert('Export view as image or 3D model.')
            }>
              Export View
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MapView;