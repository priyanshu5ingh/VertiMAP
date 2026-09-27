import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './DataSources.css';

const DataSources = () => {
  const [sources, setSources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSources = async () => {
      try {
        setLoading(true);
        const response = await axios.get((process.env.REACT_APP_API_URL || 'http://localhost:8000/api/v1') + '/datasources/');
        setSources(response.data);
        setLoading(false);
      } catch (err) {
        setError('Failed to load data sources');
        setLoading(false);
        console.error(err);
      }
    };

    fetchSources();
  }, []);

  if (loading) return <div className="data-sources-page">Loading...</div>;
  if (error) return <div className="data-sources-page">Error: {error}</div>;

  return (
    <div className="data-sources-page">
      <div className="page-header glass-panel">
        <h1>Data Source Management</h1>
        <Link to="/datasources/new" className="btn btn-primary">Add New Data Source</Link>
      </div>

      {sources.length === 0 ? (
        <div className="empty-state glass-panel">
          <h3>No Data Sources Found</h3>
          <p>Get started by adding your first data source or importing external data.</p>
          <Link to="/datasources/new" className="btn btn-primary">Create First Data Source</Link>
        </div>
      ) : (
        <div className="sources-grid">
          {sources.map(source => (
            <div
              key={source.id}
              className="source-card bento-item glass-panel metallic-border"
            >
              <div className="source-header">
                <div className="source-title">
                  <h3>{source.name}</h3>
                  <span className="source-type-tag">{source.source_type}</span>
                </div>
                <div className="source-status">
                  <span className={`status-badge ${source.is_processed ? 'processed' : 'pending'}`}>
                    {source.is_processed ? 'Processed' : 'Pending'}
                  </span>
                </div>
              </div>

              <div className="source-details">
                {source.description && (
                  <p className="source-description">{source.description}</p>
                )}
                {source.file_path && (
                  <div className="source-file">
                    <span className="label">File:</span>
                    <span className="value">{source.file_path.split('/').pop()}</span>
                  </div>
                )}
                {source.metadata && (
                  <div className="source-metadata">
                    <span className="label">Metadata:</span>
                    <span className="value">{source.metadata.length > 50 ?
                      source.metadata.substring(0, 50) + '...' :
                      source.metadata
                    }</span>
                  </div>
                )}
                <div className="source-timestamps">
                  <span className="label">Added:</span>
                  <span className="value">
                    {new Date(source.created_at).toLocaleDateString()}
                  </span>
                  {source.processed_at && (
                    <>
                      <span className="label">Processed:</span>
                      <span className="value">
                        {new Date(source.processed_at).toLocaleDateString()}
                      </span>
                    </>
                  )}
                </div>
              </div>

              <div className="source-actions">
                <Link
                  to={`/datasources/${source.id}`}
                  className="btn btn-sm btn-outline"
                >
                  View Details
                </Link>
                {!source.is_processed && (
                  <button
                    className="btn btn-sm btn-secondary"
                    onClick={() => {
                      alert('Processing functionality coming soon!');
                    }}
                  >
                    Process Data
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DataSources;