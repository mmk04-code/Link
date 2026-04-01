import React, { useEffect, useMemo, useState } from 'react';
import AdminLayout from '../components/AdminLayout';
import api from '../api';
import '../styles/AdminMessages.css';

function AdminMessages() {
  const [data, setData] = useState({ stats: {}, results: [] });
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const token = localStorage.getItem('adminAccess');
        if (!token) {
          setLoading(false);
          return;
        }

        setLoading(true);
        setError('');
        const response = await api.get('/admin/messages/', {
          headers: { Authorization: `Bearer ${token}` },
          params: {
            search: searchTerm,
          },
        });
        setData(response.data || { stats: {}, results: [] });
      } catch (err) {
        console.error('Failed to load admin messages', err);
        setError('Unable to load messages.');
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, [searchTerm]);

  const groupedByContract = useMemo(() => {
    return (data.results || []).reduce((acc, message) => {
      const key = message.contract_id;
      if (!acc[key]) {
        acc[key] = {
          title: message.contract_title,
          contractId: message.contract_id,
          count: 0,
          latestAt: message.created_at,
        };
      }
      acc[key].count += 1;
      if (new Date(message.created_at) > new Date(acc[key].latestAt)) {
        acc[key].latestAt = message.created_at;
      }
      return acc;
    }, {});
  }, [data.results]);

  if (loading) {
    return <div className="admin-loading">Loading messages...</div>;
  }

  return (
    <AdminLayout onSearch={setSearchTerm}>
      <div className="admin-messages-page">
        <div className="page-header">
          <h1>Messages</h1>
          <p>Review contract conversations across the platform</p>
        </div>

        {error && <p className="error-text">{error}</p>}

        <div className="stats-cards">
          <div className="stat-card"><span>Total</span><strong>{data.stats?.total ?? 0}</strong></div>
          <div className="stat-card"><span>Unread</span><strong>{data.stats?.unread ?? 0}</strong></div>
          <div className="stat-card">
            <span>Contracts with messages</span>
            <strong>{data.stats?.contracts_with_messages ?? 0}</strong>
          </div>
        </div>

        <section className="contract-summary">
          <h3>Conversation Summary</h3>
          <div className="summary-grid">
            {Object.values(groupedByContract).map((item) => (
              <article key={item.contractId} className="summary-card">
                <h4>{item.title}</h4>
                <p>Contract #{item.contractId}</p>
                <p>{item.count} messages</p>
                <p>Last activity: {item.latestAt ? new Date(item.latestAt).toLocaleString() : '-'}</p>
              </article>
            ))}
            {!Object.keys(groupedByContract).length && <p className="empty-text">No conversations found.</p>}
          </div>
        </section>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Contract</th>
                <th>Sender</th>
                <th>Receiver</th>
                <th>Message</th>
                <th>Read</th>
                <th>Sent</th>
              </tr>
            </thead>
            <tbody>
              {(data.results || []).map((message) => (
                <tr key={message.id}>
                  <td>
                    <div className="table-cell-title">{message.contract_title}</div>
                    <div className="table-cell-sub">#{message.contract_id}</div>
                  </td>
                  <td>{message.sender_name}</td>
                  <td>{message.receiver_name}</td>
                  <td className="message-cell">{message.content}</td>
                  <td>{message.is_read ? 'Yes' : 'No'}</td>
                  <td>{message.created_at ? new Date(message.created_at).toLocaleString() : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!(data.results || []).length && <p className="empty-text">No messages found.</p>}
        </div>
      </div>
    </AdminLayout>
  );
}

export default AdminMessages;
