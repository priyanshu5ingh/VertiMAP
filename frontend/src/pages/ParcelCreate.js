import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './ParcelCreate.css';

const ParcelCreate = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    ulpin: '',
    parcel_name: '',
    description: '',
    area_sqm: '',
    boundary_wkt: '',
    centroid_lat: '',
    centroid_lng: '',
    elevation_min: '',
    elevation_max: '',
    is_active: true
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      // Convert empty strings to null for optional fields
      const payload = {
        ...formData,
        area_sqm: formData.area_sqm ? parseFloat(formData.area_sqm) : null,
        boundary_wkt: formData.boundary_wkt || null,
        centroid_lat: formData.centroid_lat ? parseFloat(formData.centroid_lat) : null,
        centroid_lng: formData.centroid_lng ? parseFloat(formData.centroid_lng) : null,
        elevation_min: formData.elevation_min ? parseFloat(formData.elevation_min) : null,
        elevation_max: formData.elevation_max ? parseFloat(formData.elevation_max) : null
      };
      const response = await axios.post((process.env.REACT_APP_API_URL || 'http://localhost:8000/api/v1') + '/parcels/', payload);
      setSuccess(true);
      setError(null);
      // Redirect to parcel list after a short delay
      setTimeout(() => {
        navigate('/parcels');
      }, 1500);
    } catch (err) {
      setLoading(false);
      if (err.response) {
        setError(err.response.data.detail || 'Failed to create parcel');
      } else {
        setError('Network error');
      }
      console.error(err);
    }
  };

  if (success) {
    return (
      <div className="parcel-create-page">
        <div className="page-header glass-panel">
          <h1>Parcel Created Successfully</h1>
          <p>Redirecting to parcel list...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="parcel-create-page">
      <div className="page-header glass-panel">
        <h1>Create New Parcel</h1>
      </div>

      <form onSubmit={handleSubmit} className="parcel-form glass-panel">
        <div className="form-grid bento-grid bento-grid-2">
          <div>
            <label>ULPIN *</label>
            <input
              type="text"
              name="ulpin"
              value={formData.ulpin}
              onChange={handleChange}
              required
              className="form-input"
            />
          </div>
          <div>
            <label>Parcel Name *</label>
            <input
              type="text"
              name="parcel_name"
              value={formData.parcel_name}
              onChange={handleChange}
              required
              className="form-input"
            />
          </div>
          <div>
            <label>Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="form-input"
              rows="3"
            />
          </div>
          <div>
            <label>Area (sqm)</label>
            <input
              type="number"
              name="area_sqm"
              value={formData.area_sqm}
              onChange={handleChange}
              className="form-input"
              step="0.01"
              min="0"
            />
          </div>
          <div>
            <label>Boundary WKT (optional)</label>
            <textarea
              name="boundary_wkt"
              value={formData.boundary_wkt}
              onChange={handleChange}
              className="form-input"
              rows="2"
            />
          </div>
          <div>
            <label>Centroid Latitude</label>
            <input
              type="number"
              name="centroid_lat"
              value={formData.centroid_lat}
              onChange={handleChange}
              className="form-input"
              step="0.000001"
              min="-90"
              max="90"
            />
          </div>
          <div>
            <label>Centroid Longitude</label>
            <input
              type="number"
              name="centroid_lng"
              value={formData.centroid_lng}
              onChange={handleChange}
              className="form-input"
              step="0.000001"
              min="-180"
              max="180"
            />
          </div>
          <div>
            <label>Min Elevation (m)</label>
            <input
              type="number"
              name="elevation_min"
              value={formData.elevation_min}
              onChange={handleChange}
              className="form-input"
              step="0.01"
            />
          </div>
          <div>
            <label>Max Elevation (m)</label>
            <input
              type="number"
              name="elevation_max"
              value={formData.elevation_max}
              onChange={handleChange}
              className="form-input"
              step="0.01"
            />
          </div>
          <div>
            <label>Active</label>
            <input
              type="checkbox"
              name="is_active"
              checked={formData.is_active}
              onChange={handleChange}
              className="form-checkbox"
            />
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Creating...' : 'Create Parcel'}
          </button>
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => navigate('/parcels')}
          >
            Cancel
          </button>
        </div>

        {error && (
          <div className="alert alert-error glass-panel">
            <strong>Error:</strong> {error}
          </div>
        )}
      </form>
    </div>
  );
};

export default ParcelCreate;