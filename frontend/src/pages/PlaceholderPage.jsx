import React from 'react';
import { Construction, FileSignature, ClipboardList, MessagesSquare } from 'lucide-react';

const PlaceholderPage = ({ title = 'Coming Soon', icon }) => (
  <div style={{
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 'calc(100vh - 58px)',
    background: 'var(--bg-base)',
    padding: '24px'
  }}>
    <div style={{
      background: 'var(--bg-surface)',
      border: '1px solid var(--border-subtle)',
      borderRadius: 'var(--radius-lg)',
      padding: '48px',
      textAlign: 'center',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      maxWidth: '500px',
      width: '100%',
      boxShadow: '0 4px 24px rgba(0, 0, 0, 0.2)'
    }}>
      <span style={{ marginBottom: '16px', opacity: '0.8', display: 'block', color: 'var(--brand)' }}>
        {icon || <Construction size={48} strokeWidth={1.9} />}
      </span>
      <h2 style={{ 
        fontSize: '20px', 
        fontWeight: '600', 
        color: '#FFFFFF', 
        margin: '0 0 8px',
        letterSpacing: '-0.3px'
      }}>
        {title}
      </h2>
      <p style={{ 
        fontSize: '13px', 
        color: 'var(--text-faint)', 
        margin: '0 0 24px',
        lineHeight: '1.6'
      }}>
        This module is currently under active development. We're building something amazing, check back soon!
      </p>
      <div style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '6px 12px',
        background: 'var(--brand-dim)',
        color: 'var(--brand)',
        borderRadius: 'var(--radius-pill)',
        fontSize: '11px',
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: '0.06em'
      }}>
        Work in Progress
      </div>
    </div>
  </div>
);

/* Export named pages for routing */
export const ContractsPage = () => <PlaceholderPage title="Contracts Management" icon={<FileSignature size={48} strokeWidth={1.9} />} />;
export const ContractDetailPage = () => <PlaceholderPage title="Contract Details" icon={<ClipboardList size={48} strokeWidth={1.9} />} />;
export const MessagesPage = () => <PlaceholderPage title="Messages & Chat" icon={<MessagesSquare size={48} strokeWidth={1.9} />} />;
export const AdminMessagesPage = () => <PlaceholderPage title="Admin Communications" icon={<MessagesSquare size={48} strokeWidth={1.9} />} />;

export default PlaceholderPage;
