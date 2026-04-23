import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api';
import '../styles/ContractDetailPage.css';

function ContractDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [contract, setContract] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [myReview, setMyReview] = useState(null);
  const [contractReviews, setContractReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [reviewForm, setReviewForm] = useState({ budget: '', start_date: '', end_date: '' });
  const [error, setError] = useState('');
  const bottomRef = useRef(null);

  const token = localStorage.getItem('access');

  const authHeaders = useMemo(() => ({
    Authorization: `Bearer ${token}`,
  }), [token]);

  const loadContractData = useCallback(async () => {
    if (!token) {
      navigate('/login');
      return;
    }

    try {
      setError('');
      const [userRes, contractRes, messageRes, reviewsRes] = await Promise.all([
        api.get('/users/me/', { headers: authHeaders }),
        api.get(`/contracts/${id}/`, { headers: authHeaders }),
        api.get('/messages/contract/', {
          headers: authHeaders,
          params: { contract_id: id },
        }),
        api.get('/reviews/', {
          headers: authHeaders,
          params: { contract: id },
        }),
      ]);

      const currentUser = userRes.data;
      const reviewList = Array.isArray(reviewsRes.data) ? reviewsRes.data : reviewsRes.data?.results || [];
      setUser(currentUser);
      setContract(contractRes.data);
      setMessages(Array.isArray(messageRes.data) ? messageRes.data : []);
      setContractReviews(reviewList);
      setMyReview(reviewList.find((item) => item.reviewer === currentUser.id) || null);
    } catch (err) {
      console.error('Failed to load contract detail', err);
      setError('Unable to load contract details.');
    } finally {
      setLoading(false);
    }
  }, [authHeaders, id, navigate, token]);

  useEffect(() => {
    loadContractData();
  }, [loadContractData]);

  useEffect(() => {
    if (!token) return undefined;
    const interval = setInterval(async () => {
      try {
        const res = await api.get('/messages/contract/', {
          headers: authHeaders,
          params: { contract_id: id },
        });
        setMessages(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error('Failed to refresh messages', err);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [authHeaders, id, token]);

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const isClient = user && contract && user.id === contract.client;
  const isFreelancer = user && contract && user.id === contract.freelancer;
  const awaitingFreelancer = contract?.pending_action_by === 'FREELANCER';
  const awaitingClient = contract?.pending_action_by === 'CLIENT';
  const completionAwaitingClient = contract?.status === 'active' && awaitingClient;

  useEffect(() => {
    if (!contract) return;
    setReviewForm({
      budget: String(contract.budget || ''),
      start_date: contract.start_date || '',
      end_date: contract.end_date || '',
    });
  }, [contract]);

  const otherPartyName = useMemo(() => {
    if (!contract || !user) return 'Counterparty';
    if (isClient) {
      return contract.freelancer_details?.username || contract.freelancer_name || 'Freelancer';
    }
    return contract.client_details?.username || contract.client_name || 'Client';
  }, [contract, user, isClient]);

  const sendMessage = async (event) => {
    event.preventDefault();
    if (!newMessage.trim()) return;

    try {
      setSending(true);
      await api.post('/messages/', {
        contract: Number(id),
        content: newMessage.trim(),
      }, { headers: authHeaders });

      setNewMessage('');
      const res = await api.get('/messages/contract/', {
        headers: authHeaders,
        params: { contract_id: id },
      });
      setMessages(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Message send failed', err);
      alert('Unable to send message.');
    } finally {
      setSending(false);
    }
  };

  const requestCompletion = async () => {
    if (!contract || contract.status !== 'active' || !isFreelancer) return;

    const okay = window.confirm('Send completion request to client for verification?');
    if (!okay) return;

    try {
      setUpdatingStatus(true);
      const res = await api.post(`/contracts/${id}/request-completion/`, {}, { headers: authHeaders });
      setContract(res.data);
    } catch (err) {
      console.error('Completion request failed', err);
      alert(err?.response?.data?.error || 'Could not request completion.');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const clientCompletionDecision = async (decision) => {
    if (!contract || contract.status !== 'active' || !isClient) return;

    try {
      setUpdatingStatus(true);
      const res = await api.post(`/contracts/${id}/completion-decision/`, { decision }, { headers: authHeaders });
      setContract(res.data);
      if (decision === 'verify') {
        navigate(`/contracts/${id}/review`);
      }
    } catch (err) {
      console.error('Completion decision failed', err);
      alert(err?.response?.data?.error || 'Could not submit completion decision.');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const freelancerAcceptDraft = async () => {
    try {
      setUpdatingStatus(true);
      const res = await api.post(`/contracts/${id}/freelancer-review/`, { action: 'accept' }, { headers: authHeaders });
      setContract(res.data);
    } catch (err) {
      alert(err?.response?.data?.error || 'Unable to accept draft.');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const freelancerEditDraft = async () => {
    try {
      setUpdatingStatus(true);
      const res = await api.post(`/contracts/${id}/freelancer-review/`, {
        action: 'edit',
        budget: reviewForm.budget,
        start_date: reviewForm.start_date || null,
        end_date: reviewForm.end_date || null,
      }, { headers: authHeaders });
      setContract(res.data);
    } catch (err) {
      alert(err?.response?.data?.error || 'Unable to submit edits.');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const clientDecision = async (decision) => {
    try {
      setUpdatingStatus(true);
      const res = await api.post(`/contracts/${id}/client-decision/`, { decision }, { headers: authHeaders });
      setContract(res.data);
    } catch (err) {
      alert(err?.response?.data?.error || 'Unable to submit decision.');
    } finally {
      setUpdatingStatus(false);
    }
  };

  if (loading) {
    return <div className="cdp-loading">Loading contract details...</div>;
  }

  if (error || !contract) {
    return (
      <div className="cdp-error-wrap">
        <p>{error || 'Contract not found.'}</p>
        <button type="button" onClick={() => navigate('/contracts')}>Back to contracts</button>
      </div>
    );
  }

  return (
    <div className="cdp-page">
      <div className="cdp-top">
        <div>
          <h2>{contract.title}</h2>
          <p className="cdp-subtitle">Working with {otherPartyName}</p>
        </div>
        <div className="cdp-status">Status: <span className={`cdp-pill ${contract.status}`}>{contract.status}</span></div>
      </div>

      <div className="cdp-grid">
        <section className="cdp-card">
          <h3>Contract Details</h3>
          <p className="cdp-description">{contract.description || 'No description provided.'}</p>

          <div className="cdp-summary-lines">
            <div><strong>Project:</strong> {contract.project_title || '-'}</div>
            <div><strong>Client:</strong> {contract.client_name || '-'}</div>
            <div><strong>Freelancer:</strong> {contract.freelancer_name || '-'}</div>
            <div><strong>Proposal:</strong> {contract.proposal_cover_letter || '-'}</div>
          </div>

          <div className="cdp-meta-grid">
            <div>
              <span>Budget</span>
              <strong>{contract.currency || 'USD'} {Number(contract.budget || 0).toLocaleString()}</strong>
            </div>
            <div>
              <span>Created</span>
              <strong>{contract.created_at ? new Date(contract.created_at).toLocaleDateString() : '-'}</strong>
            </div>
            <div>
              <span>Start Date</span>
              <strong>{contract.start_date || '-'}</strong>
            </div>
            <div>
              <span>End Date</span>
              <strong>{contract.end_date || '-'}</strong>
            </div>
          </div>

          <div className="cdp-actions">
            {isFreelancer && awaitingFreelancer && contract.status === 'draft' && (
              <>
                <button type="button" className="cdp-btn" disabled={updatingStatus} onClick={freelancerAcceptDraft}>
                  Accept Draft
                </button>
                <button type="button" className="cdp-btn secondary" disabled={updatingStatus} onClick={freelancerEditDraft}>
                  Submit Edits
                </button>
              </>
            )}

            {isClient && awaitingClient && contract.status === 'draft' && (
              <>
                <button type="button" className="cdp-btn" disabled={updatingStatus} onClick={() => clientDecision('accept')}>
                  Accept Freelancer Changes
                </button>
                <button type="button" className="cdp-btn secondary" disabled={updatingStatus} onClick={() => clientDecision('reject')}>
                  Reject Contract
                </button>
              </>
            )}

            {isFreelancer && contract.status === 'active' && !completionAwaitingClient && (
              <button type="button" className="cdp-btn secondary" disabled={updatingStatus} onClick={requestCompletion}>
                Mark ask complete
              </button>
            )}

            {isClient && completionAwaitingClient && (
              <>
                <button type="button" className="cdp-btn" disabled={updatingStatus} onClick={() => clientCompletionDecision('verify')}>
                  Verify
                </button>
                <button type="button" className="cdp-btn secondary" disabled={updatingStatus} onClick={() => clientCompletionDecision('not_complete')}>
                  Not Complete
                </button>
              </>
            )}

            {contract.status === 'completed' && (
              <button
                type="button"
                className="cdp-btn secondary"
                disabled={Boolean(myReview)}
                onClick={() => navigate(`/contracts/${id}/review`)}
              >
                {myReview ? 'Review submitted' : 'Leave a review'}
              </button>
            )}

            <button type="button" className="cdp-btn ghost" onClick={() => navigate('/contracts')}>
              Back to contracts
            </button>
          </div>

          {isFreelancer && awaitingFreelancer && contract.status === 'draft' && (
            <div className="cdp-edit-grid">
              <h4>Edit before accepting</h4>
              <label>Budget</label>
              <input value={reviewForm.budget} type="number" onChange={(e) => setReviewForm({ ...reviewForm, budget: e.target.value })} />
              <label>Start date</label>
              <input value={reviewForm.start_date} type="date" onChange={(e) => setReviewForm({ ...reviewForm, start_date: e.target.value })} />
              <label>End date</label>
              <input value={reviewForm.end_date} type="date" onChange={(e) => setReviewForm({ ...reviewForm, end_date: e.target.value })} />
            </div>
          )}

          {completionAwaitingClient && (
            <div className="cdp-confirm-state">
              Completion requested. Waiting for client verification.
            </div>
          )}

          <div className="cdp-reviews-block">
            <h3>Contract Reviews</h3>
            {contractReviews.length === 0 ? (
              <p className="cdp-reviews-empty">No reviews submitted for this contract yet.</p>
            ) : (
              <div className="cdp-reviews-list">
                {contractReviews.map((review) => (
                  <div key={review.id} className="cdp-review-card">
                    <div className="cdp-review-top">
                      <strong>{review.title || 'Review'}</strong>
                      <span className="cdp-review-rating">{Number(review.overall_rating || 0).toFixed(1)}★</span>
                    </div>
                    <div className="cdp-review-meta">
                      {review.reviewer_name || 'User'} {'->'} {review.reviewee_name || 'User'}
                    </div>
                    <p className="cdp-review-comment">{review.comment || 'No comment provided.'}</p>
                    <div className="cdp-review-date">
                      {review.created_at ? new Date(review.created_at).toLocaleDateString() : '-'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="cdp-card cdp-chat-card">
          <h3>Contract Chat</h3>
          <div className="cdp-chat-stream">
            {messages.length === 0 ? (
              <p className="cdp-empty-chat">No messages yet. Start the conversation.</p>
            ) : (
              messages.map((message) => {
                const mine = message.sender === user?.id || message.sender_id === user?.id;
                return (
                  <div key={message.id} className={`cdp-msg-row ${mine ? 'mine' : 'theirs'}`}>
                    <div className={`cdp-msg-bubble ${mine ? 'mine' : 'theirs'}`}>
                      <div className="cdp-msg-author">{mine ? 'You' : (message.sender_details?.username || otherPartyName)}</div>
                      <p>{message.content}</p>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={bottomRef} />
          </div>

          <form className="cdp-message-form" onSubmit={sendMessage}>
            <textarea
              value={newMessage}
              onChange={(event) => setNewMessage(event.target.value)}
              placeholder="Write a message..."
              rows={2}
            />
            <button type="submit" disabled={sending || !newMessage.trim()}>
              {sending ? 'Sending...' : 'Send'}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}

export default ContractDetailPage;
