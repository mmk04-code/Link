import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api';
import '../styles/ReviewPage.css';

const initialForm = {
  communication_rating: 5,
  quality_rating: 5,
  professionalism_rating: 5,
  title: '',
  comment: '',
  pros: '',
  cons: '',
  would_recommend: true,
};

function ReviewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [contract, setContract] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const token = localStorage.getItem('access');

  const authHeaders = useMemo(() => ({
    Authorization: `Bearer ${token}`,
  }), [token]);

  const fetchData = useCallback(async () => {
    if (!token) {
      navigate('/login');
      return;
    }

    try {
      setError('');
      const [userRes, contractRes, reviewsRes] = await Promise.all([
        api.get('/users/me/', { headers: authHeaders }),
        api.get(`/contracts/${id}/`, { headers: authHeaders }),
        api.get('/reviews/', {
          headers: authHeaders,
          params: { contract: id },
        }),
      ]);

      const reviewsData = Array.isArray(reviewsRes.data) ? reviewsRes.data : reviewsRes.data?.results || [];
      setUser(userRes.data);
      setContract(contractRes.data);
      setReviews(reviewsData);
    } catch (err) {
      console.error('Failed to load review page data', err);
      setError('Unable to load review flow for this contract.');
    } finally {
      setLoading(false);
    }
  }, [authHeaders, id, navigate, token]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const myReview = useMemo(() => {
    if (!user) return null;
    return reviews.find((item) => item.reviewer === user.id) || null;
  }, [reviews, user]);

  const canReview = useMemo(() => {
    if (!user || !contract) return false;
    const participant = user.id === contract.client || user.id === contract.freelancer;
    return participant && contract.status === 'completed' && !myReview;
  }, [contract, myReview, user]);

  const handleInput = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const submitReview = async (event) => {
    event.preventDefault();
    if (!canReview) return;

    try {
      setSubmitting(true);
      setError('');
      await api.post('/reviews/', {
        contract: Number(id),
        communication_rating: Number(form.communication_rating),
        quality_rating: Number(form.quality_rating),
        professionalism_rating: Number(form.professionalism_rating),
        title: form.title.trim(),
        comment: form.comment.trim(),
        pros: form.pros.trim(),
        cons: form.cons.trim(),
        would_recommend: Boolean(form.would_recommend),
      }, {
        headers: authHeaders,
      });

      alert('Review submitted successfully.');
      navigate(`/contracts/${id}`);
    } catch (err) {
      const detail = err?.response?.data;
      if (detail?.non_field_errors?.length) {
        setError(detail.non_field_errors[0]);
      } else if (typeof detail?.detail === 'string') {
        setError(detail.detail);
      } else {
        setError('Could not submit your review.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="review-loading">Loading review flow...</div>;
  }

  if (error && !contract) {
    return (
      <div className="review-error-wrap">
        <p>{error}</p>
        <button type="button" onClick={() => navigate('/contracts')}>Back to contracts</button>
      </div>
    );
  }

  return (
    <div className="review-page">
      <div className="review-header">
        <h2>Contract Review</h2>
        <p>{contract?.title}</p>
      </div>

      {myReview && (
        <div className="review-alert info">
          You have already submitted a review for this contract.
        </div>
      )}

      {contract?.status !== 'completed' && (
        <div className="review-alert warning">
          Reviews can only be submitted when the contract is completed.
        </div>
      )}

      {error && <div className="review-alert error">{error}</div>}

      <form className="review-form" onSubmit={submitReview}>
        <div className="review-grid">
          <label>
            Communication
            <input
              type="number"
              min="1"
              max="5"
              value={form.communication_rating}
              onChange={(event) => handleInput('communication_rating', event.target.value)}
              disabled={!canReview}
            />
          </label>
          <label>
            Quality
            <input
              type="number"
              min="1"
              max="5"
              value={form.quality_rating}
              onChange={(event) => handleInput('quality_rating', event.target.value)}
              disabled={!canReview}
            />
          </label>
          <label>
            Professionalism
            <input
              type="number"
              min="1"
              max="5"
              value={form.professionalism_rating}
              onChange={(event) => handleInput('professionalism_rating', event.target.value)}
              disabled={!canReview}
            />
          </label>
        </div>

        <label>
          Review title
          <input
            type="text"
            value={form.title}
            onChange={(event) => handleInput('title', event.target.value)}
            placeholder="Summarize your experience"
            disabled={!canReview}
            required
          />
        </label>

        <label>
          Comment
          <textarea
            rows={5}
            value={form.comment}
            onChange={(event) => handleInput('comment', event.target.value)}
            placeholder="What went well and what can improve?"
            disabled={!canReview}
            required
          />
        </label>

        <div className="review-grid">
          <label>
            Pros
            <textarea
              rows={3}
              value={form.pros}
              onChange={(event) => handleInput('pros', event.target.value)}
              disabled={!canReview}
              placeholder="Positive points"
            />
          </label>
          <label>
            Cons
            <textarea
              rows={3}
              value={form.cons}
              onChange={(event) => handleInput('cons', event.target.value)}
              disabled={!canReview}
              placeholder="Areas for improvement"
            />
          </label>
        </div>

        <label className="review-checkbox">
          <input
            type="checkbox"
            checked={form.would_recommend}
            onChange={(event) => handleInput('would_recommend', event.target.checked)}
            disabled={!canReview}
          />
          I would recommend working with this person.
        </label>

        <div className="review-actions">
          <button type="button" className="secondary" onClick={() => navigate(`/contracts/${id}`)}>
            Back to contract
          </button>
          <button type="submit" disabled={!canReview || submitting}>
            {submitting ? 'Submitting...' : 'Submit review'}
          </button>
        </div>
      </form>

      {!!reviews.length && (
        <section className="review-existing">
          <h3>Existing Reviews</h3>
          {reviews.map((item) => (
            <article key={item.id}>
              <div className="row">
                <strong>{item.title}</strong>
                <span>Rating: {Number(item.overall_rating || 0).toFixed(1)}</span>
              </div>
              <p>{item.comment}</p>
            </article>
          ))}
        </section>
      )}
    </div>
  );
}

export default ReviewPage;
