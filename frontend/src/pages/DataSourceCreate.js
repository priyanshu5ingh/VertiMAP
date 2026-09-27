import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './DataSourceCreate.css';

const DataSourceCreate = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    source_type: '',
    description: '',
    file_path: '',
    metadata: '',
    is_processed: false
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
      // Prepare payload: metadata as string (JSON)
      const payload = {
        ...formData,
        metadata: formData.metadata || null
      };
      const response = await axios.post((process.env.REACT_APP_API_URL || 'http://localhost:8000/api/v1') + '/datasources/', payload);
      setSuccess(true);
      setError(null);
      // Redirect to data sources list after a short delay
      setTimeout(() => {
        navigate('/datasources');
      }, 1500);
    } catch (err) {
      setLoading(false);
      if (err.response) {
        setError(err.response.data.detail || 'Failed to create data source');
      } else {
        setError('Network error');
      }
      console.error(err);
    }
  };

  if (success) {
    return (
      <div className="data-source-create-page">
        <div className="page-header glass-panel">
          <h1>Data Source Created Successfully</h1>
          <p>Redirecting to data source list...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="data-source-create-page">
      <div className="page-header glass-panel">
        <h1>Create New Data Source</h1>
      </div>

      <form onSubmit={handleSubmit} className="data-source-form glass-panel">
        <div className="form-grid bento-grid bento-grid-2">
          <div>
            <label>Name *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="form-input"
            />
          </div>
          <div>
            <label>Source Type *</label>
            <select
              name="source_type"
              value={formData.source_type}
              onChange={handleChange}
              required
              className="form-input"
            >
              <option value="">Select source type</option>
              <option value="drone">Drone</option>
              <option value="lidar">LiDAR</option>
              <option value="satellite">Satellite</option>
              <option value="survey">Survey</option>
              <option value="gis">GIS</option>
              <option value="other">Other</option>
            </select>
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
            <label>File Path</label>
            <input
              type="text"
              name="file_path"
              value={formData.file_path}
              onChange={handleChange}
              className="form-input"
            />
          </div>
          <div>
            <label>Metadata (JSON)</label>
            <textarea
              name="metadata"
              value={formData.metadata}
              onChange={handleChange}
              className="form-input"
              rows="3"
              placeholder='Enter JSON metadata (optional)'
            />
          </div>
          <div>
            <label>Processed</label>
            <input
              type="checkbox"
              name="is_processed"
              checked={formData.is_processed}
              onChange={handleChange}
              className="form-checkbox"
            />
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Creating...' : 'Create Data Source'}
          </button>
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => navigate('/datasources')}
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

export default DataSourceCreate;