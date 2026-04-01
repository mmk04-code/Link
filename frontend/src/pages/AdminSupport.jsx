import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../api';
import AdminLayout from '../components/AdminLayout';
import '../styles/AdminDashboard.css';

const SUPPORT_STATUS_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'under_review', label: 'Under Review' },
  { value: 'warning_issued', label: 'Warning Issued' },
  { value: 'user_hidden', label: 'User Hidden' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'dismissed', label: 'Dismissed' },
];

const ALLOWED_STATUSES = SUPPORT_STATUS_OPTIONS.map((opt) => opt.value);

const ACTION_LABELS = {
  review: 'Review',
  warning: 'Warn',
  hide: 'Hide User',
  resolve: 'Resolve',
  dismiss: 'Dismiss',
};

const ACTION_MESSAGES = {
  review: 'move this ticket to Under Review',
  warning: 'issue a warning to the reported user',
  hide: 'hide the reported user account',
  resolve: 'mark this ticket as Resolved',
  dismiss: 'dismiss this ticket',
};

function AdminSupport() {
  const location = useLocation();
  const queryStatus = new URLSearchParams(location.search).get('status');
  const initialStatus = ALLOWED_STATUSES.includes(queryStatus) ? queryStatus : 'all';

  const [items, setItems] = useState([]);
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionDialog, setActionDialog] = useState({
    isOpen: false,
    itemId: null,
    action: null,
    note: '',
    submitting: false,
  });

  useEffect(() => {
    const nextStatus = ALLOWED_STATUSES.includes(queryStatus) ? queryStatus : 'all';
    setStatusFilter(nextStatus);
  }, [queryStatus]);

  const loadItems = useCallback(async (status) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminAccess');
      const endpoint = `/dashboard/support/tickets/?status=${status}`;

      const response = await api.get(endpoint, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setItems(response.data || []);
    } catch (err) {
      alert('Unable to load report data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadItems(statusFilter);
  }, [statusFilter, loadItems]);

  const getAvailableActions = (status) => {
    const normalized = (status || '').toLowerCase();
    if (normalized === 'pending') return ['review', 'warning', 'hide', 'dismiss'];
    if (normalized === 'under_review') return ['warning', 'hide', 'resolve', 'dismiss'];
    if (normalized === 'warning_issued' || normalized === 'user_hidden') return ['resolve', 'dismiss'];
    if (normalized === 'resolved' || normalized === 'dismissed') return ['review'];
    return ['review', 'warning', 'hide', 'resolve', 'dismiss'];
  };

  const openActionDialog = (id, action) => {
    setActionDialog({
      isOpen: true,
      itemId: id,
      action,
      note: '',
      submitting: false,
    });
  };

  const closeActionDialog = () => {
    if (actionDialog.submitting) return;
    setActionDialog({
      isOpen: false,
      itemId: null,
      action: null,
      note: '',
      submitting: false,
    });
  };

  const applyAction = async () => {
    if (!actionDialog.itemId || !actionDialog.action) return;

    setActionDialog((prev) => ({ ...prev, submitting: true }));

    try {
      const token = localStorage.getItem('adminAccess');
      const endpoint = `/dashboard/admin/support/${actionDialog.itemId}/action/`;

      await api.post(endpoint, {
        action: actionDialog.action,
        note: actionDialog.note.trim(),
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      await loadItems(statusFilter);
      closeActionDialog();
    } catch (err) {
      setActionDialog((prev) => ({ ...prev, submitting: false }));
      alert(err?.response?.data?.error || 'Action failed.');
    }
  };

  const requiresOptionalNote = actionDialog.action === 'warning' || actionDialog.action === 'hide';

  const filteredItems = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return items;

    return items.filter((item) => {
      const haystack = [
        String(item.id || ''),
        item.category || '',
        item.subject || '',
        item.details || '',
        item.description || '',
        item.status || '',
        item.reporter_name || '',
        item?.reporter?.full_name || '',
        item?.reporter?.email || '',
        item.reported_user_name || '',
        item?.reported_user?.full_name || '',
        item?.reported_user?.email || '',
      ]
        .join(' ')
        .toLowerCase();

      return haystack.includes(query);
    });
  }, [items, searchTerm]);

  return (
    <AdminLayout onSearch={setSearchTerm}>
      <div className="admin-dashboard-content">
        <h1>Support Tickets</h1>
        <div style={{ marginBottom: '10px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            {SUPPORT_STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        {loading ? <p>Loading...</p> : (
          <table className="activity-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Reporter</th>
                <th>Reported User</th>
                <th>Category</th>
                <th>Subject</th>
                <th>Description</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((item) => (
                <tr key={item.id}>
                  <td>{item.id}</td>
                  <td>
                    <div className="report-person-cell">
                      <div className="person-name">{item?.reporter?.full_name || item.reporter_name}</div>
                      <div className="person-meta">@{item.reporter_name} | {item?.reporter?.email || '-'}</div>
                      <div className="person-meta">Role: {item?.reporter?.role || '-'}</div>
                    </div>
                  </td>
                  <td>
                    {item?.reported_user ? (
                      <div className="report-person-cell">
                        <div className="person-name">{item.reported_user.full_name || item.reported_user_name}</div>
                        <div className="person-meta">@{item.reported_user_name} | {item.reported_user.email || '-'}</div>
                        <div className="person-meta">Role: {item.reported_user.role} | Verified: {item.reported_user.is_verified ? 'Yes' : 'No'}</div>
                        <div className="person-meta">Location: {item.reported_user.location || '-'}</div>
                      </div>
                    ) : '-'}
                  </td>
                  <td>{item.category}</td>
                  <td>{item.subject}</td>
                  <td>
                    <div className="report-details-cell">
                      <div className="person-meta">{item.details || item.description || 'No description.'}</div>
                      {Array.isArray(item.messages) && item.messages.length > 0 && (
                        <div className="person-meta" style={{ marginTop: 4 }}>
                          Latest reply: {item.messages[item.messages.length - 1].sender_name} - {item.messages[item.messages.length - 1].message}
                        </div>
                      )}
                    </div>
                  </td>
                  <td>{item.status}</td>
                  <td>
                    <div className="report-actions">
                      {getAvailableActions(item.status).map((action) => (
                        <button
                          key={`${item.id}-${action}`}
                          type="button"
                          onClick={() => openActionDialog(item.id, action)}
                        >
                          {ACTION_LABELS[action] || action}
                        </button>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
              {!filteredItems.length && (
                <tr>
                  <td colSpan="8">No records found for this filter.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}

        {actionDialog.isOpen && (
          <div className="support-action-modal-backdrop" role="presentation" onClick={closeActionDialog}>
            <div className="support-action-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
              <h2>{ACTION_LABELS[actionDialog.action] || 'Confirm Action'}</h2>
              <p>
                Are you sure you want to {ACTION_MESSAGES[actionDialog.action] || actionDialog.action}?
              </p>

              {requiresOptionalNote && (
                <div className="support-action-note-wrap">
                  <label htmlFor="support-action-note">Optional note</label>
                  <textarea
                    id="support-action-note"
                    rows={3}
                    placeholder="Add context for this action (optional)"
                    value={actionDialog.note}
                    onChange={(e) => setActionDialog((prev) => ({ ...prev, note: e.target.value }))}
                  />
                </div>
              )}

              <div className="support-action-modal-buttons">
                <button type="button" onClick={closeActionDialog} disabled={actionDialog.submitting}>Cancel</button>
                <button type="button" onClick={applyAction} disabled={actionDialog.submitting}>
                  {actionDialog.submitting ? 'Applying...' : 'Confirm'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

export default AdminSupport;
