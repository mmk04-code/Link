import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import api from '../api';
import '../styles/ContractCreateFromProposal.css';

function ContractCreateFromProposal() {
  const { proposalId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = localStorage.getItem('access');

  const [proposal, setProposal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const autoStartDate = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);

  const defaultBid = useMemo(() => {
    const fromQuery = Number.parseFloat(searchParams.get('bid_amount') || '');
    if (Number.isFinite(fromQuery) && fromQuery > 0) return String(fromQuery);
    return '';
  }, [searchParams]);

  const [form, setForm] = useState({
    title: '',
    budget: defaultBid,
    currency: 'USD',
    schedule_mode: 'end_date',
    end_date: '',
    duration_days: '',
  });

  useEffect(() => {
    const load = async () => {
      if (!token) {
        navigate('/login');
        return;
      }
      try {
        const [userRes, proposalsRes] = await Promise.all([
          api.get('/users/me/', { headers: { Authorization: `Bearer ${token}` } }),
          api.get('/proposals/received/', { headers: { Authorization: `Bearer ${token}` } }),
        ]);

        if (userRes.data.role !== 'CLIENT') {
          navigate('/proposals');
          return;
        }

        const list = Array.isArray(proposalsRes.data) ? proposalsRes.data : [];
        const target = list.find((p) => Number(p.id) === Number(proposalId));
        if (!target) {
          setError('Proposal not found or no longer available.');
          return;
        }

        setProposal(target);
        setForm((prev) => ({
          ...prev,
          title: `Contract for ${target.project_title}`,
          budget: prev.budget || String(target.bid_amount || ''),
        }));
      } catch (e) {
        setError('Unable to load proposal details.');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [navigate, proposalId, token]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const budget = Number.parseFloat(form.budget);
    if (!Number.isFinite(budget) || budget <= 0) {
      setError('Please enter a valid budget.');
      return;
    }

    const mode = form.schedule_mode;
    const hasEndDate = (form.end_date || '').trim() !== '';
    const durationValue = Number.parseInt(form.duration_days || '', 10);
    const hasDuration = Number.isFinite(durationValue) && durationValue > 0;

    if (mode === 'end_date' && !hasEndDate) {
      setError('Please select an end date.');
      return;
    }

    if (mode === 'duration' && !hasDuration) {
      setError('Please enter a valid duration in days.');
      return;
    }

    try {
      setSaving(true);
      const payload = {
        bid_amount: budget,
        title: form.title,
        budget,
        currency: form.currency,
        end_date: mode === 'end_date' ? form.end_date : null,
        duration_days: mode === 'duration' ? durationValue : null,
        terms: {
          initial_bid_amount: proposal?.bid_amount,
          proposal_cover_letter: proposal?.cover_letter,
          schedule_mode: mode,
          auto_start_date: autoStartDate,
        },
      };

      const res = await api.post(`/proposals/${proposalId}/accept/`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const contractId = res?.data?.contract_id;
      if (contractId) {
        navigate(`/contracts/${contractId}`);
      } else {
        navigate('/contracts');
      }
    } catch (e) {
      const data = e?.response?.data;
      setError(data?.error || data?.detail || 'Unable to create contract draft.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="ccfp-wrap">Loading contract form...</div>;

  return (
    <div className="ccfp-wrap">
      <div className="ccfp-card">
        <h2>Create Contract Draft</h2>
        <p className="ccfp-sub">This draft will be sent to freelancer for review.</p>

        {proposal && (
          <div className="ccfp-summary">
            <div><strong>Project:</strong> {proposal.project_title}</div>
            <div><strong>Freelancer:</strong> {proposal.freelancer_name}</div>
            <div><strong>Proposal:</strong> {proposal.cover_letter}</div>
          </div>
        )}

        <form onSubmit={onSubmit} className="ccfp-form">
          <label>Title</label>
          <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />

          <label>Freelancer Proposal (Read Only)</label>
          <textarea value={proposal?.cover_letter || ''} rows={4} readOnly />

          <div className="ccfp-grid">
            <div>
              <label>Budget</label>
              <input type="number" value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })} required />
            </div>
            <div>
              <label>Currency</label>
              <select value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })}>
                <option value="USD">USD</option>
                <option value="INR">INR</option>
              </select>
            </div>
          </div>

          <label>Start Date (Auto Selected)</label>
          <input type="date" value={autoStartDate} readOnly />

          <label>Schedule Type</label>
          <div className="ccfp-mode-row">
            <label className="ccfp-mode-option">
              <input
                type="radio"
                name="schedule-mode"
                checked={form.schedule_mode === 'end_date'}
                onChange={() => setForm((prev) => ({ ...prev, schedule_mode: 'end_date' }))}
              />
              <span>Choose End Date</span>
            </label>
            <label className="ccfp-mode-option">
              <input
                type="radio"
                name="schedule-mode"
                checked={form.schedule_mode === 'duration'}
                onChange={() => setForm((prev) => ({ ...prev, schedule_mode: 'duration' }))}
              />
              <span>Choose Duration (days)</span>
            </label>
          </div>

          {form.schedule_mode === 'end_date' ? (
            <>
              <label>End Date</label>
              <input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
            </>
          ) : (
            <>
              <label>Duration (days)</label>
              <input type="number" min="1" value={form.duration_days} onChange={(e) => setForm({ ...form, duration_days: e.target.value })} />
            </>
          )}

          {error && <p className="ccfp-error">{error}</p>}

          <div className="ccfp-actions">
            <button type="button" className="ghost" onClick={() => navigate('/proposals')}>Cancel</button>
            <button type="submit" disabled={saving}>{saving ? 'Creating...' : 'Send to Freelancer'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ContractCreateFromProposal;
