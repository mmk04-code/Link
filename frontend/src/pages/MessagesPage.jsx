import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { MessagesSquare } from 'lucide-react';
import '../styles/MessagesPage.css';
import { useNotifications } from '../context/NotificationContext';

const toAbsoluteMediaUrl = (url) => {
  if (!url || typeof url !== 'string') return '';
  if (/^https?:\/\//i.test(url)) return url;
  const apiOrigin = (window.__API_ORIGIN__ || 'http://127.0.0.1:8000').replace(/\/+$/, '');
  if (url.startsWith('/')) return `${apiOrigin}${url}`;
  return url;
};

const safeMessageText = (value) => {
  if (typeof value === 'string') return value;
  if (value == null) return '';
  try {
    return JSON.stringify(value);
  } catch (_) {
    return String(value);
  }
};

// TODO: endpoint /api/messages/conversations/ may be needed for conversation list
// Current approach: use /api/contracts/ as conversations (messages are per-contract)

function MessagesPage() {
  const [contracts, setContracts] = useState([]);
  const [activeContract, setActiveContract] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loadingContracts, setLoadingContracts] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [userId, setUserId] = useState(null);
  const [error, setError] = useState('');
  const messagesEndRef = useRef(null);
  const pollRef = useRef(null);
  const navigate = useNavigate();
  const [brokenImages, setBrokenImages] = useState({});
  const { notifications, refresh: refreshNotifications, isMessageNotification } = useNotifications();
  const location = useLocation();
  const autoOpenedRef = useRef(false);

  const routeQuery = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const openUnreadFromRoute = routeQuery.get('open') === 'unread';
  const preferredContractId = useMemo(() => {
    const raw = routeQuery.get('contract') || routeQuery.get('contractId');
    const parsed = Number.parseInt(raw || '', 10);
    return Number.isNaN(parsed) ? null : parsed;
  }, [routeQuery]);

  /* ── Fetch current user & contract list ── */
  const fetchContracts = useCallback(async () => {
    try {
      const token = localStorage.getItem('access');
      if (!token) { navigate('/'); return; }
      const [userRes, contractsRes] = await Promise.all([
        axios.get('http://127.0.0.1:8000/api/users/me/', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get('http://127.0.0.1:8000/api/contracts/', { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      setUserId(userRes.data.id);
      const list = Array.isArray(contractsRes.data)
        ? contractsRes.data
        : contractsRes.data?.results || [];
      setContracts(list);
    } catch (err) {
      setError('Unable to load conversations.');
    } finally {
      setLoadingContracts(false);
    }
  }, [navigate]);

  useEffect(() => { fetchContracts(); }, [fetchContracts]);

  /* ── Fetch messages for active contract ── */
  const fetchMessages = useCallback(async (contractId) => {
    try {
      const token = localStorage.getItem('access');
      // TODO: endpoint /api/messages/?contract_id={id} needed
      const res = await axios.get(`http://127.0.0.1:8000/api/messages/contract/`, {
        params: { contract_id: contractId },
        headers: { Authorization: `Bearer ${token}` },
      });
      const list = Array.isArray(res.data) ? res.data : res.data?.results || [];
      setMessages(list);
    } catch (err) {
      if (err?.response?.status === 404) {
        setMessages([]); // endpoint not yet ready
      }
    }
  }, []);

  /* ── Open a conversation ── */
  const openConversation = useCallback((contract) => {
    setActiveContract(contract);
    setMessages([]);
    setLoadingMessages(true);
    fetchMessages(contract.id)
      .finally(async () => {
        setLoadingMessages(false);
        await refreshNotifications();
      });
  }, [fetchMessages, refreshNotifications]);

  useEffect(() => {
    if (loadingContracts || !contracts.length || autoOpenedRef.current || activeContract) return;

    let target = null;

    if (preferredContractId) {
      target = contracts.find((c) => Number(c.id) === preferredContractId) || null;
    }

    if (!target && openUnreadFromRoute) {
      const unreadMessageNotifications = notifications.filter((n) => !n.is_read && isMessageNotification(n));
      const unreadContractIds = unreadMessageNotifications
        .map((n) => Number(n?.related_contract || n?.data?.contract_id || 0))
        .filter((id) => Number.isInteger(id) && id > 0);

      if (unreadContractIds.length) {
        target = contracts.find((c) => unreadContractIds.includes(Number(c.id))) || null;
      }
    }

    if (target) {
      autoOpenedRef.current = true;
      openConversation(target);
    }
  }, [
    loadingContracts,
    contracts,
    activeContract,
    preferredContractId,
    openUnreadFromRoute,
    notifications,
    isMessageNotification,
    openConversation,
  ]);

  /* ── Poll for new messages every 5 sec ── */
  useEffect(() => {
    if (!activeContract) return;
    pollRef.current = setInterval(() => fetchMessages(activeContract.id), 5000);
    return () => clearInterval(pollRef.current);
  }, [activeContract, fetchMessages]);

  /* ── Auto-scroll to bottom ── */
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  /* ── Send a message ── */
  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeContract) return;
    try {
      const token = localStorage.getItem('access');
      // TODO: endpoint POST /api/messages/ needed
      await axios.post('http://127.0.0.1:8000/api/messages/', {
        contract: activeContract.id,
        content: newMessage.trim(),
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNewMessage('');
      fetchMessages(activeContract.id);
    } catch (err) {
      alert('Could not send message. The messaging endpoint may not be set up yet.');
    }
  };

  const getOtherParty = (contract) => {
    const role = (localStorage.getItem('role') || '').toUpperCase();
    const pick = (...values) => {
      const firstValid = values.find((value) => typeof value === 'string' && value.trim());
      return firstValid ? firstValid.trim() : null;
    };

    if (role === 'CLIENT') {
      return pick(
        contract.freelancer_name,
        contract.freelancer_full_name,
        contract.freelancer_details?.full_name,
        contract.freelancer_details?.username,
        contract.freelancer_username,
        contract.freelancer_email,
      ) || 'Freelancer';
    }

    return pick(
      contract.client_name,
      contract.client_full_name,
      contract.client_details?.full_name,
      contract.client_details?.username,
      contract.client_username,
      contract.client_email,
    ) || 'Client';
  };

  const getOtherPartyImage = (contract) => {
    const role = (localStorage.getItem('role') || '').toUpperCase();
    const imageUrl = role === 'CLIENT'
      ? (contract.freelancer_profile_image || '')
      : (contract.client_profile_image || '');
    return toAbsoluteMediaUrl(imageUrl);
  };

  const isImageBroken = (key) => !!brokenImages[key];
  const markImageBroken = (key) => {
    setBrokenImages((prev) => ({ ...prev, [key]: true }));
  };

  if (error) return (
    <div className="mp-error"><p>{error}</p></div>
  );

  return (
    <div className="mp-wrapper">
      {/* ── Left: conversation list ── */}
      <div className="mp-left">
        <div className="mp-left-header">Messages</div>
        {loadingContracts ? (
          <div className="mp-empty">Loading…</div>
        ) : contracts.length === 0 ? (
          <div className="mp-empty">No conversations yet</div>
        ) : (
          contracts.map(c => (
            <div
              key={c.id}
              className={`mp-convo-item ${activeContract?.id === c.id ? 'active' : ''}`}
              onClick={() => openConversation(c)}
            >
              <div className="mp-convo-avatar">
                {getOtherPartyImage(c) && !isImageBroken(`convo-${c.id}`) ? (
                  <img
                    className="mp-avatar-img"
                    src={getOtherPartyImage(c)}
                    alt={getOtherParty(c)}
                    onError={() => markImageBroken(`convo-${c.id}`)}
                  />
                ) : (
                  getOtherParty(c).charAt(0).toUpperCase()
                )}
              </div>
              <div className="mp-convo-info">
                <div className="mp-convo-name">{getOtherParty(c)}</div>
                <div className="mp-convo-sub">{c.title}</div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* ── Right: chat panel ── */}
      <div className="mp-right">
        {!activeContract ? (
          <div className="mp-placeholder">
            <MessagesSquare size={40} strokeWidth={1.8} className="mp-placeholder-icon" />
            <p>Select a conversation to start chatting</p>
          </div>
        ) : (
          <>
            <div className="mp-chat-header">
              <div className="mp-chat-avatar">
                {getOtherPartyImage(activeContract) && !isImageBroken(`chat-${activeContract.id}`) ? (
                  <img
                    className="mp-avatar-img"
                    src={getOtherPartyImage(activeContract)}
                    alt={getOtherParty(activeContract)}
                    onError={() => markImageBroken(`chat-${activeContract.id}`)}
                  />
                ) : (
                  getOtherParty(activeContract).charAt(0).toUpperCase()
                )}
              </div>
              <div>
                <div className="mp-chat-name">{getOtherParty(activeContract)}</div>
                <div className="mp-chat-sub">{activeContract.title}</div>
              </div>
            </div>

            <div className="mp-chat-body">
              {loadingMessages ? (
                <div className="mp-msg-loading">Loading messages…</div>
              ) : messages.length === 0 ? (
                <div className="mp-msg-empty">No messages yet. Say hello! 👋</div>
              ) : (
                messages.map(msg => {
                  const isMine = msg.sender === userId || msg.sender_id === userId;
                  return (
                    <div key={msg.id} className={`mp-bubble-row ${isMine ? 'mine' : 'theirs'}`}>
                      <div className={`mp-bubble ${isMine ? 'mp-bubble-mine' : 'mp-bubble-theirs'}`}>
                        {safeMessageText(msg.content)}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            <form className="mp-input-row" onSubmit={sendMessage}>
              <textarea
                className="mp-textarea"
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
                placeholder="Type a message…"
                rows={1}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(e); }
                }}
              />
              <button type="submit" className="mp-send-btn" disabled={!newMessage.trim()}>Send</button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

export default MessagesPage;
