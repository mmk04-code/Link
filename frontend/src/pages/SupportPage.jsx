import React, { useEffect, useState } from 'react';
import api from '../api';
import '../styles/SupportPage.css';

const CATEGORY_OPTIONS = [
  { value: 'misbehavior', label: 'Misbehavior' },
  { value: 'fake_company', label: 'Fake Company' },
  { value: 'payment_issue', label: 'Payment Issue' },
  { value: 'scam_risk', label: 'Scam Risk' },
  { value: 'other', label: 'Other' },
];

function SupportPage() {
  const [myTickets, setMyTickets] = useState([]);
  const [ticketsAgainstMe, setTicketsAgainstMe] = useState([]);
  const [myProposalReports, setMyProposalReports] = useState([]);
  const [proposalReportsAgainstMe, setProposalReportsAgainstMe] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [replyDrafts, setReplyDrafts] = useState({});
  const [sendToReporterFlags, setSendToReporterFlags] = useState({});
  const [proposalReplyDrafts, setProposalReplyDrafts] = useState({});
  const [proposalShareFlags, setProposalShareFlags] = useState({});
  const [form, setForm] = useState({
    reported_username: '',
    reported_email: '',
    category: 'misbehavior',
    subject: '',
    description: '',
  });

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access');
      const [createdRes, againstMeRes, myReportsRes, reportsAgainstRes] = await Promise.all([
        api.get('/dashboard/support/tickets/?scope=created', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        api.get('/dashboard/support/tickets/?scope=against_me', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        api.get('/dashboard/reports/?scope=created', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        api.get('/dashboard/reports/?scope=against_me', {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      setMyTickets(createdRes.data || []);
      setTicketsAgainstMe(againstMeRes.data || []);
      setMyProposalReports(myReportsRes.data || []);
      setProposalReportsAgainstMe(reportsAgainstRes.data || []);
      setError('');
    } catch (err) {
      console.error('Support fetch error:', err);
      setError('Unable to load support tickets.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const submitReply = async (ticketId) => {
    const message = (replyDrafts[ticketId] || '').trim();
    if (!message) {
      alert('Please enter a message before sending.');
      return;
    }

    try {
      const token = localStorage.getItem('access');
      await api.post(
        `/dashboard/support/tickets/${ticketId}/reply/`,
        {
          message,
          send_to_reporter: Boolean(sendToReporterFlags[ticketId]),
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setReplyDrafts((prev) => ({ ...prev, [ticketId]: '' }));
      setSendToReporterFlags((prev) => ({ ...prev, [ticketId]: false }));
      await fetchTickets();
      alert('Reply sent to admin successfully.');
    } catch (err) {
      const backendError = err?.response?.data?.error || 'Failed to send reply.';
      alert(backendError);
    }
  };

  const submitProposalReply = async (reportId) => {
    const message = (proposalReplyDrafts[reportId] || '').trim();
    if (!message) {
      alert('Please enter a message before sending.');
      return;
    }

    try {
      const token = localStorage.getItem('access');
      await api.post(
        `/dashboard/reports/${reportId}/reply/`,
        {
          message,
          send_to_reporter: Boolean(proposalShareFlags[reportId]),
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setProposalReplyDrafts((prev) => ({ ...prev, [reportId]: '' }));
      setProposalShareFlags((prev) => ({ ...prev, [reportId]: false }));
      await fetchTickets();
      alert('Reply sent to admin successfully.');
    } catch (err) {
      const backendError = err?.response?.data?.error || 'Failed to send reply.';
      alert(backendError);
    }
  };

  const submitTicket = async (event) => {
    event.preventDefault();
    try {
      const token = localStorage.getItem('access');
      await api.post('/dashboard/support/tickets/', {
        ...form,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setForm({
        reported_username: '',
        reported_email: '',
        category: 'misbehavior',
        subject: '',
        description: '',
      });
      await fetchTickets();
      alert('Support request submitted successfully.');
    } catch (err) {
      const backendError = err?.response?.data?.error || 'Failed to submit support request.';
      alert(backendError);
    }
  };

  return (
    <div className="support-page">
      <div className="support-card">
        <h2>Support</h2>
        <p className="support-intro">
          Report safety issues or suspicious activity to admin. Clients can report freelancers, and freelancers can report clients.
        </p>

        <form className="support-form" onSubmit={submitTicket}>
          <div className="support-grid">
            <label>
              Reported Username
              <input
                type="text"
                placeholder="Enter reported username"
                value={form.reported_username}
                onChange={(e) => setForm({ ...form, reported_username: e.target.value })}
              />
            </label>

            <label>
              Reported Email
              <input
                type="email"
                placeholder="Enter reported email"
                value={form.reported_email}
                onChange={(e) => setForm({ ...form, reported_email: e.target.value })}
              />
            </label>
          </div>
          <p className="support-intro" style={{ marginTop: 0 }}>
            Enter at least one identifier: username or email.
          </p>

          <label>
            Category
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              required
            >
              {CATEGORY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </label>

          <label>
            Subject
            <input
              type="text"
              value={form.subject}
              onChange={(e) => setForm({ ...form, subject: e.target.value })}
              placeholder="Short summary of the issue"
              required
            />
          </label>

          <label>
            Details
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Describe what happened, when, and any proof you have."
              rows={5}
              required
            />
          </label>

          <button type="submit" className="support-submit-btn">Send to Admin</button>
        </form>
      </div>

      <div className="support-card">
        <h3>My Proposal Reports</h3>
        {!loading && !myProposalReports.length && <p>No proposal reports created yet.</p>}

        {!!myProposalReports.length && (
          <div className="support-ticket-list">
            {myProposalReports.map((report) => (
              <div className="support-ticket" key={report.id}>
                <div className="support-ticket-head">
                  <strong>Report #{report.id} - {report.reason}</strong>
                  <span className={`support-status status-${report.status}`}>{report.status}</span>
                </div>
                <p><strong>Project:</strong> {report.project_title}</p>
                <p><strong>Reported user:</strong> {report.reported_user_name}</p>
                <p>{report.details || 'No details provided.'}</p>
                {report.action_note ? <p><strong>Admin note:</strong> {report.action_note}</p> : null}
                {Array.isArray(report.messages) && report.messages.length > 0 ? (
                  <div className="support-thread">
                    <p><strong>Thread:</strong></p>
                    {report.messages.map((msg) => (
                      <p key={msg.id}>
                        <strong>{msg.sender_name}:</strong> {msg.message}
                      </p>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="support-card">
        <h3>Proposal Reports Against Me</h3>
        <p className="support-intro">
          These come from proposal report actions (homepage report flow). Reply admin here, and enable share to send apology to reporter.
        </p>
        {!loading && !proposalReportsAgainstMe.length && <p>No proposal reports found against your account.</p>}

        {!!proposalReportsAgainstMe.length && (
          <div className="support-ticket-list">
            {proposalReportsAgainstMe.map((report) => (
              <div className="support-ticket" key={report.id}>
                <div className="support-ticket-head">
                  <strong>Report #{report.id} - {report.reason}</strong>
                  <span className={`support-status status-${report.status}`}>{report.status}</span>
                </div>
                <p><strong>Project:</strong> {report.project_title}</p>
                <p><strong>Reporter:</strong> {report.reporter_name}</p>
                <p>{report.details || 'No details provided.'}</p>
                {Array.isArray(report.messages) && report.messages.length > 0 ? (
                  <div className="support-thread">
                    <p><strong>Thread:</strong></p>
                    {report.messages.map((msg) => (
                      <p key={msg.id}>
                        <strong>{msg.sender_name}:</strong> {msg.message}
                      </p>
                    ))}
                  </div>
                ) : null}

                <div className="support-reply-box">
                  <textarea
                    value={proposalReplyDrafts[report.id] || ''}
                    onChange={(e) => setProposalReplyDrafts((prev) => ({ ...prev, [report.id]: e.target.value }))}
                    rows={3}
                    placeholder="Reply to admin. Example: Sorry, I will not repeat this behavior."
                  />
                  <label className="support-checkbox">
                    <input
                      type="checkbox"
                      checked={Boolean(proposalShareFlags[report.id])}
                      onChange={(e) => setProposalShareFlags((prev) => ({ ...prev, [report.id]: e.target.checked }))}
                    />
                    Share this reply with reporter
                  </label>
                  <button
                    type="button"
                    className="support-submit-btn"
                    onClick={() => submitProposalReply(report.id)}
                  >
                    Send Reply
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="support-card">
        <h3>My Support Tickets</h3>
        {loading && <p>Loading tickets...</p>}
        {error && <p className="support-error">{error}</p>}
        {!loading && !myTickets.length && <p>No support tickets created yet.</p>}

        {!!myTickets.length && (
          <div className="support-ticket-list">
            {myTickets.map((ticket) => (
              <div className="support-ticket" key={ticket.id}>
                <div className="support-ticket-head">
                  <strong>#{ticket.id} - {ticket.subject}</strong>
                  <span className={`support-status status-${ticket.status}`}>{ticket.status}</span>
                </div>
                <p><strong>Category:</strong> {ticket.category}</p>
                <p><strong>Target:</strong> {ticket.target_role}{ticket.reported_user_name ? ` (${ticket.reported_user_name})` : ''}</p>
                <p>{ticket.description}</p>
                {ticket.admin_note ? <p><strong>Admin note:</strong> {ticket.admin_note}</p> : null}
                {Array.isArray(ticket.messages) && ticket.messages.length > 0 ? (
                  <div className="support-thread">
                    <p><strong>Replies:</strong></p>
                    {ticket.messages.map((msg) => (
                      <p key={msg.id}>
                        <strong>{msg.sender_name}:</strong> {msg.message}
                      </p>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="support-card">
        <h3>Tickets Against Me</h3>
        <p className="support-intro">
          If you are the reported user, reply to admin here. Enable "Share with reporter" when you want your apology or clarification delivered to the reporter.
        </p>
        {loading && <p>Loading tickets...</p>}
        {!loading && !ticketsAgainstMe.length && <p>No tickets found against your account.</p>}

        {!!ticketsAgainstMe.length && (
          <div className="support-ticket-list">
            {ticketsAgainstMe.map((ticket) => (
              <div className="support-ticket" key={ticket.id}>
                <div className="support-ticket-head">
                  <strong>#{ticket.id} - {ticket.subject}</strong>
                  <span className={`support-status status-${ticket.status}`}>{ticket.status}</span>
                </div>
                <p><strong>Reported by:</strong> {ticket.reporter_name}</p>
                <p><strong>Category:</strong> {ticket.category}</p>
                <p>{ticket.description}</p>

                {Array.isArray(ticket.messages) && ticket.messages.length > 0 ? (
                  <div className="support-thread">
                    <p><strong>Thread:</strong></p>
                    {ticket.messages.map((msg) => (
                      <p key={msg.id}>
                        <strong>{msg.sender_name}:</strong> {msg.message}
                      </p>
                    ))}
                  </div>
                ) : null}

                <div className="support-reply-box">
                  <textarea
                    value={replyDrafts[ticket.id] || ''}
                    onChange={(e) => setReplyDrafts((prev) => ({ ...prev, [ticket.id]: e.target.value }))}
                    rows={3}
                    placeholder="Reply to admin. Example: Sorry, I will correct this behavior."
                  />
                  <label className="support-checkbox">
                    <input
                      type="checkbox"
                      checked={Boolean(sendToReporterFlags[ticket.id])}
                      onChange={(e) => setSendToReporterFlags((prev) => ({ ...prev, [ticket.id]: e.target.checked }))}
                    />
                    Share this reply with reporter
                  </label>
                  <button
                    type="button"
                    className="support-submit-btn"
                    onClick={() => submitReply(ticket.id)}
                  >
                    Send Reply
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default SupportPage;
