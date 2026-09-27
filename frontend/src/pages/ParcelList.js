import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './ParcelList.css';

const ParcelList = () => {
  const [parcels, setParcels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchParcels = async () => {
      try {
        setLoading(true);
        const response = await axios.get((process.env.REACT_APP_API_URL || 'http://localhost:8000/api/v1') + '/parcels/');
        setParcels(response.data);
        setLoading(false);
      } catch (err) {
        setError('Failed to load parcels');
        setLoading(false);
        console.error(err);
      }
    };

    fetchParcels();
  }, []);

  if (loading) return <div className="parcel-list-page">Loading...</div>;
  if (error) return <div className="parcel-list-page">Error: {error}</div>;

  return (
    <div className="parcel-list-page">
      <div className="page-header glass-panel">
        <h1>Parcel Management</h1>
        <Link to="/parcels/new" className="btn btn-primary">Add New Parcel</Link>
      </div>

      {parcels.length === 0 ? (
        <div className="empty-state glass-panel">
          <h3>No Parcels Found</h3>
          <p>Get started by adding your first parcel or importing data.</p>
          <Link to="/parcels/new" className="btn btn-primary">Create First Parcel</Link>
        </div>
      ) : (
        <>
          <div className="search-bar glass-panel">
            <input
              type="text"
              placeholder="Search parcels by ULPIN or name..."
              className="search-input"
            />
          </div>

          <div className="parcels-grid">
            {parcels.map(parcel => (
              <div
                key={parcel.id}
                className="parcel-card bento-item glass-panel metallic-border"
              >
                <div className="parcel-header">
                  <h3 className="parcel-name">{parcel.parcel_name}</h3>
                  <span className="parcel-ulpin">{parcel.ulpin}</span>
                </div>

                <div className="parcel-details">
                  <div className="detail-item">
                    <span className="detail-label">Area:</span>
                    <span className="detail-value">
                      {parcel.area_sqm?.toFixed(2) || 'N/A'} sqm
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Status:</span>
                    <span className="detail-value status-{parcel.is_active ? 'active' : 'inactive'}">
                      {parcel.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Created:</span>
                    <span className="detail-value">
                      {new Date(parcel.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="parcel-actions">
                  <Link
                    to={`/parcels/${parcel.ulpin}`}
                    className="btn btn-sm btn-outline"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default ParcelList;