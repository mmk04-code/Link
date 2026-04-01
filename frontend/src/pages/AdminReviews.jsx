import React, { useEffect, useMemo, useState } from 'react';
import AdminLayout from '../components/AdminLayout';
import api from '../api';
import '../styles/AdminReviews.css';

const AdminReviews = () => {
  const [data, setData] = useState({ stats: {}, results: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [visibility, setVisibility] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [actingReviewId, setActingReviewId] = useState(null);

  const fetchReviews = async ({ showLoader = false } = {}) => {
    try {
      const token = localStorage.getItem('adminAccess');
      if (!token) {
        setLoading(false);
        return;
      }
      if (showLoader) setLoading(true);
      const response = await api.get('/admin/reviews/', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setData(response.data || { stats: {}, results: [] });
      setError('');
    } catch (err) {
      console.error('Failed to load reviews', err);
      setError('Unable to load reviews.');
    } finally {
      if (showLoader) setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews({ showLoader: true });
  }, []);

  const handleReviewAction = async (reviewId, action) => {
    const token = localStorage.getItem('adminAccess');
    if (!token) {
      setError('Admin session expired. Please login again.');
      return;
    }

    try {
      setActingReviewId(reviewId);
      await api.post(
        `/admin/reviews/${reviewId}/action/`,
        { action },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await fetchReviews();
    } catch (err) {
      console.error('Failed to moderate review', err);
      const apiMessage = err?.response?.data?.error;
      setError(apiMessage || 'Failed to update review moderation state.');
    } finally {
      setActingReviewId(null);
    }
  };

  const filteredReviews = useMemo(() => {
    return (data.results || []).filter((review) => {
      const matchesVisibility =
        visibility === 'all' ||
        (visibility === 'public' && review.is_public) ||
        (visibility === 'hidden' && !review.is_public) ||
        (visibility === 'flagged' && review.flagged);
      const q = searchTerm.toLowerCase();
      const matchesSearch =
        !q ||
        review.contract_title?.toLowerCase().includes(q) ||
        review.reviewer?.toLowerCase().includes(q) ||
        review.reviewee?.toLowerCase().includes(q) ||
        review.title?.toLowerCase().includes(q);
      return matchesVisibility && matchesSearch;
    });
  }, [data.results, searchTerm, visibility]);

  if (loading) {
    return <div className="admin-loading">Loading reviews...</div>;
  }

  return (
    <AdminLayout onSearch={setSearchTerm}>
      <div className="admin-reviews-page">
        <div className="page-header">
          <h1>Reviews</h1>
          <p>Moderate reviews and monitor content quality</p>
        </div>

        {error && <p className="error-text">{error}</p>}

        {/* Stats Cards Row */}
        <div className="stats-cards">
          <div className="stat-card">
            <span>Total</span>
            <strong>{data.stats?.total ?? 0}</strong>
          </div>
          <div className="stat-card">
            <span>Public</span>
            <strong>{data.stats?.public ?? 0}</strong>
          </div>
          <div className="stat-card">
            <span>Hidden</span>
            <strong>{data.stats?.hidden ?? 0}</strong>
          </div>
          <div className="stat-card">
            <span>Flagged</span>
            <strong>{data.stats?.flagged ?? 0}</strong>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="filter-tabs">
          <button type="button" className={visibility === 'all' ? 'active' : ''} onClick={() => setVisibility('all')}>
            All
          </button>
          <button
            type="button"
            className={visibility === 'public' ? 'active' : ''}
            onClick={() => setVisibility('public')}
          >
            Public
          </button>
          <button
            type="button"
            className={visibility === 'hidden' ? 'active' : ''}
            onClick={() => setVisibility('hidden')}
          >
            Hidden
          </button>
          <button
            type="button"
            className={visibility === 'flagged' ? 'active' : ''}
            onClick={() => setVisibility('flagged')}
          >
            Flagged
          </button>
        </div>

        {/* DataTable Wrapper */}
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Title</th>
                <th>Contract</th>
                <th>Reviewer</th>
                <th>Reviewee</th>
                <th>Rating</th>
                <th>Visibility</th>
                <th>Flagged</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredReviews.map((review) => (
                <tr key={review.id}>
                  <td>
                    <div className="table-cell-title">{review.title}</div>
                    <div className="table-cell-desc">
                      {review.comment?.length > 40 ? review.comment.substring(0, 40) + '...' : review.comment}
                    </div>
                  </td>
                  <td>{review.contract_title}</td>
                  <td>{review.reviewer}</td>
                  <td>{review.reviewee}</td>
                  <td>
                    <span className="rating-pill">★ {Number(review.overall_rating || 0).toFixed(1)}</span>
                  </td>
                  <td>
                    <span className={`status-badge ${review.is_public ? 'active' : 'inactive'}`}>
                      {review.is_public ? 'Public' : 'Hidden'}
                    </span>
                  </td>
                  <td>
                    <span className={`status-badge ${review.flagged ? 'flagged' : 'clear'}`}>
                      {review.flagged ? 'Flagged' : 'No'}
                    </span>
                  </td>
                  <td>
                    <div className="admin-actions-cell">
                      <button
                        type="button"
                        className="btn-action btn-mute"
                        onClick={() => handleReviewAction(review.id, review.is_public ? 'hide' : 'show')}
                        disabled={actingReviewId === review.id}
                      >
                        {review.is_public ? 'Hide' : 'Show'}
                      </button>
                      <button
                        type="button"
                        className="btn-action btn-danger"
                        onClick={() => handleReviewAction(review.id, review.flagged ? 'unflag' : 'flag')}
                        disabled={actingReviewId === review.id}
                      >
                        {review.flagged ? 'Unflag' : 'Flag'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!filteredReviews.length && (
            <div className="empty-panel">
              <div className="empty-icon">🗂️</div>
              <p className="empty-title">No reviews found.</p>
              <p className="empty-subtitle">Try adjusting your filters or search query.</p>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminReviews;
