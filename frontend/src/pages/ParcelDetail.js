import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import './ParcelDetail.css';

const ParcelDetail = () => {
  const { ulpin } = useParams();
  const [parcel, setParcel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({});

  useEffect(() => {
    const fetchParcelData = async () => {
      try {
        setLoading(true);
        // Fetch parcel data
        const parcelResponse = await axios.get(
          `${process.env.REACT_APP_API_URL || 'http://localhost:8000/api/v1'}/parcels/?ulpin=${ulpin}`
        );
        if (parcelResponse.data.length > 0) {
          setParcel(parcelResponse.data[0]);

          # Attempt to fetch related statistics (if endpoints exist)
          try {
            const statsResponse = await axios.get(
              `${process.env.REACT_APP_API_URL || 'http://localhost:8000/api/v1'}/parcels/${parcelResponse.data[0].id}/stats`
            );
            setStats(statsResponse.data);
          } catch (statsError) {
            # Stats endpoint might not exist yet, that's okay
            console.log('Stats endpoint not available:', statsError.message);
          }
        } else {
          setError('Parcel not found');
        }
        setLoading(false);
      } catch (err) {
        setError('Failed to load parcel data');
        setLoading(false);
        console.error(err);
      }
    };

    fetchParcelData();
  }, [ulpin]);

  if (loading) return <div className="parcel-detail-page">Loading...</div>;
  if (error) return <div className="parcel-detail-page">Error: {error}</div>;
  if (!parcel) return <div className="parcel-detail-page">No parcel data</div>;

  return (
    <div className="parcel-detail-page">
      <div className="page-header glass-panel">
        <div className="header-content">
          <h1>Parcel Details</h1>
          <p className="subtitle">Explore the complete information for this land parcel</p>
        </div>
        <Link to="/parcels" className="btn btn-outline">Back to Parcels List</Link>
      </div>

      {parcel && (
        <>
          <div className="info-grid bento-grid bento-grid-3">
            {/* Basic Information Card */}
            <div className="info-card bento-item glass-panel metallic-border">
              <h2 className="info-title">Parcel Information</h2>
              <div className="info-content">
                <div className="info-row">
                  <span className="info-label">ULPIN:</span>
                  <span className="info-value">{parcel.ulpin}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Parcel Name:</span>
                  <span className="info-value">{parcel.parcel_name}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Description:</span>
                  <span className="info-value">
                    {parcel.description || 'No description available'}
                  </span>
                </div>
                <div className="info-row">
                  <span className="info-label">Area:</span>
                  <span className="info-value">
                    {parcel.area_sqm?.toFixed(2) || 'N/A'} sqm
                  </span>
                </div>
              </div>
            </div>

            {/* Location Card */}
            <div className="info-card bento-item glass-panel metallic-border">
              <h2 className="info-title">Location Details</h2>
              <div className="info-content">
                {parcel.centroid_lat && parcel.centroid_lng ? (
                  <>
                    <div className="info-row">
                      <span className="info-label">Latitude:</span>
                      <span className="info-value">
                        {parcel.centroid_lat.toFixed(6)}°
                      </span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">Longitude:</span>
                      <span className="info-value">
                        {parcel.centroid_lng.toFixed(6)}°
                      </span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">Coordinates:</span>
                      <span className="info-value">
                        {parcel.centroid_lat.toFixed(6)}°, {parcel.centroid_lng.toFixed(6)}°
                      </span>
                    </div>
                  </>
                ) : (
                  <p className="no-data">Location data not available</p>
                )}
              </div
            </div>

            {/* Elevation Card */}
            <div className="info-card bento-item glass-panel metallic-border">
              <h2 className="info-title">Elevation Profile</h2>
              <div className="info-content">
                {parcel.elevation_min !== null && parcel.elevation_max !== null ? (
                  <>
                    <div className="info-row">
                      <span className="info-label">Minimum Elevation:</span>
                      <span className="info-value">
                        {parcel.elevation_min} m
                      </span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">Maximum Elevation:</span>
                      <span className="info-value">
                        {parcel.elevation_max} m
                      </span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">Elevation Range:</span>
                      <span className="info-value">
                        {((parcel.elevation_max || 0) - (parcel.elevation_min || 0)).toFixed(2)} m
                      </span>
                    </div
                    <div className="info-row">
                      <span className="info-label">Average Elevation:</span>
                      <span className="info-value">
                        {(((parcel.elevation_min || 0) + (parcel.elevation_max || 0)) / 2).toFixed(2)} m
                      </span>
                    </div>
                  </>
                ) : (
                  <p className="no-data">Elevation data not available</p>
                )}
              </div>
            </div>

            {/* Boundary Information Card */}
            <div className="info-card bento-item glass-panel metallic-border" style={{ gridRow: 'span 2' }}>
              <h2 className="info-title">Boundary Information</h2>
              <div className="info-content">
                {parcel.boundary_wkt ? (
                  <div className="boundary-preview">
                    <p className="boundary-label">Boundary (WKT Format):</p>
                    <div className="boundary-text">
                      {parcel.boundary_wkt.length > 100 ?
                        parcel.boundary_wkt.substring(0, 100) + '...' :
                        parcel.boundary_wkt
                      }
                    </div>
                    <button className="btn btn-sm btn-outline" onClick={() =>
                      navigator.clipboard.writeText(parcel.boundary_wkt).then(() =>
                        alert('Boundary copied to clipboard!')
                      )
                    }>
                      Copy WKT
                    </button>
                  </div>
                ) : (
                  <p className="no-data">Boundary data not available</p>
                )}
              </div>
            </div>

            {/* Statistics Card */}
            <div className="info-card bento-item glass-panel metallic-border">
              <h2 className="info-title">Related Statistics</h2>
              <div className="info-content">
                {Object.keys(stats).length > 0 ? (
                  <>
                    <div className="info-row">
                      <span className="info-label">Buildings:</span>
                      <span className="info-value">
                        {stats.buildings || 0}
                      </span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">Floors:</span>
                      <span className="info-value">
                        {stats.floors || 0}
                      </span
                    </div>
                    <div className="info-row">
                      <span className="info-label">Units:</span>
                      <span className="info-value">
                        {stats.units || 0}
                      </span
                    </div>
                    <div className="info-row">
                      <span className="info-label">Underground Structures:</span>
                      <span className="info-value">
                        {stats.underground || 0}
                      </span
                    </div>
                  </>
                ) : (
                  <p className="no-data">Extended statistics not available</p>
                )}
              </div>
            </div>

            {/* Actions Card */}
            <div className="info-card bento-item glass-panel metallic-border">
              <h2 className="info-title">Available Actions</h2>
              <div className="info-content actions-panel">
                <div className="action-buttons">
                  <Link
                    to={`/parcels/${parcel.ulpin}/edit`}
                    className="btn btn-primary"
                  >
                    Edit Parcel
                  </Link>
                  <button
                    className="btn btn-secondary"
                    onClick={() => {
                      if (confirm('Are you sure you want to delete this parcel? This action cannot be undone.')) {
                        alert('Delete functionality coming soon!');
                      }
                    }}
                  >
                    Delete Parcel
                  </button>
                </div>

                <div className="action-buttons">
                  <Link
                    to={`/map?parcel=${parcel.ulpin}`}
                    className="btn btn-outline"
                  >
                    View on 3D Map
                  </Link>
                  <button
                    className="btn btn-outline"
                    onClick={() =>
                      navigator.clipboard.writeText(parcel.ulpin).then(() =>
                        alert('ULPIN copied to clipboard!')
                      )
                    }
                  >
                    Copy ULPIN
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ParcelDetail;