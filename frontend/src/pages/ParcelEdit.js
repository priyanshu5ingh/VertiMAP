import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './ParcelEdit.css';

const ParcelEdit = () => {
  const { ulpin } = useParams();
  const navigate = useNavigate();
  const [parcel, setParcel] = useState(null);
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
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Fetch parcel data on mount
  useEffect(() => {
    const fetchParcel = async () => {
      setLoading(true);
      try {
        const response = await axios.get(
          `${process.env.REACT_APP_API_URL || 'http://localhost:8000/api/v1'}/parcels/?ulpin=${ulpin}`
        );
        if (response.data.length > 0) {
          const p = response.data[0];
          setParcel(p);
          // Initialize form data
          setFormData({
            ulpin: p.ulpin,
            parcel_name: p.parcel_name,
            description: p.description || '',
            area_sqm: p.area_sqm ? p.area_sqm.toString() : '',
            boundary_wkt: p.boundary_wkt || '',
            centroid_lat: p.centroid_lat ? p.centroid_lat.toString() : '',
            centroid_lng: p.centroid_lng ? p.centroid_lng.toString() : '',
            elevation_min: p.elevation_min ? p.elevation_min.toString() : '',
            elevation_max: p.elevation_max ? p.elevation_max.toString() : '',
            is_active: p.is_active
          });
        } else {
          setError('Parcel not found');
        }
      } catch (err) {
        setError('Failed to load parcel');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchParcel();
  }, [ulpin]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
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
      // Need parcel ID for update endpoint
      if (!parcel) {
        throw new Error('Parcel data not loaded');
      }
      const response = await axios.put(
        `${process.env.REACT_APP_API_URL || 'http://localhost:8000/api/v1'}/parcels/${parcel.id}`,
        payload
      );
      setSaving(false);
      setSuccess(true);
      // Redirect to parcel detail after a short delay
      setTimeout(() => {
        navigate(`/parcels/${ulpin}`);
      }, 1500);
    } catch (err) {
      setSaving(false);
      if (err.response) {
        setError(err.response.data.detail || 'Failed to update parcel');
      } else {
        setError('Network error');
      }
      console.error(err);
    }
  };

  if (!parcel && loading) {
    return (
      <div className="parcel-edit-page">
        <div className="page-header glass-panel">
          <h1>Loading Parcel...</h1>
        </div>
      </div>
    );
  }

  if (!parcel) {
    return (
      <div className="parcel-edit-page">
        <div className="page-header glass-panel">
          <h1>Error Loading Parcel</h1>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="parcel-edit-page">
        <div className="page-header glass-panel">
          <h1>Parcel Updated Successfully</h1>
          <p>Redirecting back to parcel details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="parcel-edit-page">
      <div className="page-header glass-panel">
        <h1>Edit Parcel</h1>
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
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Updating...' : 'Update Parcel'}
          </button>
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => navigate(`/parcels/${ulpin}`)}
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

export default ParcelEdit;