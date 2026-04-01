import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, ChartNoAxesColumn, Wallet, ShieldCheck, ShieldAlert } from 'lucide-react';
import api from '../api';
import AdminLayout from '../components/AdminLayout';
import '../styles/AdminDashboard.css';

function buildLinePath(values, width, height, padding, maxValue) {
  if (!values.length) return '';
  const drawableW = width - padding * 2;
  const drawableH = height - padding * 2;
  return values.map((v, idx) => {
    const x = padding + (values.length === 1 ? drawableW / 2 : (idx * drawableW) / (values.length - 1));
    const y = padding + drawableH - ((v || 0) / Math.max(1, maxValue)) * drawableH;
    return `${idx === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`;
  }).join(' ');
}

function buildPointCoords(values, width, height, padding, maxValue) {
  if (!values.length) return [];
  const drawableW = width - padding * 2;
  const drawableH = height - padding * 2;
  return values.map((v, idx) => {
    const x = padding + (values.length === 1 ? drawableW / 2 : (idx * drawableW) / (values.length - 1));
    const y = padding + drawableH - ((v || 0) / Math.max(1, maxValue)) * drawableH;
    return { x, y, value: v || 0 };
  });
}

function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({});
  const [trendRange, setTrendRange] = useState('6w');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('adminAccess');
    if (token) {
      fetchDashboardData(token);
    }
  }, []);

  const fetchDashboardData = async (token) => {
    try {
      setLoading(true);
      setError('');
      const response = await api.get('/admin/dashboard/', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStats(response.data || {});
    } catch (err) {
      console.error('Failed to load admin dashboard:', err);
      setError('Unable to load dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="admin-loading">Loading admin dashboard...</div>;
  }

  if (error) {
    return <div className="admin-error">{error}</div>;
  }

  const trendSets = stats?.analytics?.trend_sets || {};
  const trendData = Array.isArray(trendSets[trendRange]) ? trendSets[trendRange] : [];
  const labels = trendData.map((item) => item.label);
  const usersSeries = trendData.map((item) => Number(item.users || 0));
  const projectsSeries = trendData.map((item) => Number(item.projects || 0));
  const contractsSeries = trendData.map((item) => Number(item.contracts || 0));
  const maxTrendValue = Math.max(1, ...usersSeries, ...projectsSeries, ...contractsSeries);

  const chartW = 720;
  const chartH = 260;
  const chartPad = 30;
  const usersPath = buildLinePath(usersSeries, chartW, chartH, chartPad, maxTrendValue);
  const projectsPath = buildLinePath(projectsSeries, chartW, chartH, chartPad, maxTrendValue);
  const contractsPath = buildLinePath(contractsSeries, chartW, chartH, chartPad, maxTrendValue);
  const usersPoints = buildPointCoords(usersSeries, chartW, chartH, chartPad, maxTrendValue);
  const projectsPoints = buildPointCoords(projectsSeries, chartW, chartH, chartPad, maxTrendValue);
  const contractsPoints = buildPointCoords(contractsSeries, chartW, chartH, chartPad, maxTrendValue);

  const exportTrendCsv = () => {
    if (!trendData.length) return;
    const header = 'Period,Users,Projects,Contracts';
    const rows = trendData.map((item) => `${item.label},${item.users || 0},${item.projects || 0},${item.contracts || 0}`);
    const csvText = [header, ...rows].join('\n');
    const blob = new Blob([csvText], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `admin-trends-${trendRange}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <AdminLayout showSearch={false}>
      <div className="admin-dashboard-content">
        <h1>Dashboard Overview</h1>

        <div className="dashboard-stats">
          <div className="stat-row">
            <div className="stat-large-card">
              <span className="stat-icon"><Users size={18} strokeWidth={2} /></span>
              <div className="stat-info">
                <h3>Total Users</h3>
                <p className="stat-number">{stats?.users?.total ?? 0}</p>
                <div className="stat-breakdown">
                  <span>Clients: {stats?.users?.clients ?? 0}</span>
                  <span>Freelancers: {stats?.users?.freelancers ?? 0}</span>
                </div>
              </div>
            </div>

            <div className="stat-large-card">
              <span className="stat-icon"><ChartNoAxesColumn size={18} strokeWidth={2} /></span>
              <div className="stat-info">
                <h3>Projects</h3>
                <p className="stat-number">{stats?.projects?.total ?? 0}</p>
                <div className="stat-breakdown">
                  <span>Open: {stats?.projects?.open ?? 0}</span>
                  <span>New: {stats?.projects?.new_this_week ?? 0}</span>
                </div>
              </div>
            </div>

            <div className="stat-large-card">
              <span className="stat-icon"><Wallet size={18} strokeWidth={2} /></span>
              <div className="stat-info">
                <h3>Platform Revenue</h3>
                <p className="stat-number">₹{Number(stats?.revenue?.total || 0).toLocaleString()}</p>
                <div className="stat-breakdown">
                  <span>Completed projects revenue (overall)</span>
                </div>
              </div>
            </div>

            <button className="stat-large-card stat-link-card" type="button" onClick={() => navigate('/admin/verifications')}>
              <span className="stat-icon"><ShieldCheck size={18} strokeWidth={2} /></span>
              <div className="stat-info">
                <h3>Verification Requests</h3>
                <p className="stat-number">{stats?.verifications?.pending ?? 0}</p>
                <div className="stat-breakdown">
                  <span>Pending admin review</span>
                </div>
              </div>
            </button>

            <button className="stat-large-card stat-link-card" type="button" onClick={() => navigate('/admin/support?status=all')}>
              <span className="stat-icon"><ShieldAlert size={18} strokeWidth={2} /></span>
              <div className="stat-info">
                <h3>Support Tickets</h3>
                <p className="stat-number">{stats?.support?.pending ?? 0}</p>
                <div className="stat-breakdown">
                  <span>Pending or under review</span>
                </div>
              </div>
            </button>
          </div>
        </div>

        <div className="recent-activity">
          <h2>Platform Summary</h2>
          <table className="activity-table">
            <thead>
              <tr>
                <th>Metric</th>
                <th>Total</th>
                <th>Active/Open</th>
                <th>Completed</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Projects</td>
                <td>{stats?.projects?.total ?? 0}</td>
                <td>{stats?.projects?.open ?? 0}</td>
                <td>-</td>
              </tr>
              <tr>
                <td>Contracts</td>
                <td>{stats?.contracts?.total ?? 0}</td>
                <td>{stats?.contracts?.active ?? 0}</td>
                <td>{stats?.contracts?.completed ?? 0}</td>
              </tr>
              <tr>
                <td>Reviews</td>
                <td>{stats?.reviews?.total ?? 0}</td>
                <td>-</td>
                <td>Avg: {stats?.reviews?.average_rating ?? 0}</td>
              </tr>
            </tbody>
          </table>
          <p className="summary-footnote">New users in last 7 days: {stats?.users?.new_this_week ?? 0}</p>
        </div>

        <div className="recent-activity" style={{ marginTop: '16px' }}>
          <div className="trend-header-row">
            <h2>Performance Trends</h2>
            <div className="trend-controls">
              <button type="button" className={`trend-range-btn ${trendRange === '6w' ? 'active' : ''}`} onClick={() => setTrendRange('6w')}>6 Weeks</button>
              <button type="button" className={`trend-range-btn ${trendRange === '12w' ? 'active' : ''}`} onClick={() => setTrendRange('12w')}>12 Weeks</button>
              <button type="button" className={`trend-range-btn ${trendRange === '6m' ? 'active' : ''}`} onClick={() => setTrendRange('6m')}>6 Months</button>
              <button type="button" className="trend-export-btn" onClick={exportTrendCsv}>Export CSV</button>
            </div>
          </div>
          {!trendData.length ? (
            <p className="summary-footnote">No trend data available yet.</p>
          ) : (
            <div className="trend-chart-wrap">
              <svg className="trend-chart" viewBox={`0 0 ${chartW} ${chartH}`} role="img" aria-label="Weekly users, projects, and contracts trend chart">
                <line x1={chartPad} y1={chartH - chartPad} x2={chartW - chartPad} y2={chartH - chartPad} className="trend-axis" />
                <line x1={chartPad} y1={chartPad} x2={chartPad} y2={chartH - chartPad} className="trend-axis" />

                <path d={usersPath} className="trend-line trend-users" />
                <path d={projectsPath} className="trend-line trend-projects" />
                <path d={contractsPath} className="trend-line trend-contracts" />

                {usersPoints.map((pt, idx) => (
                  <circle key={`u-${labels[idx]}-${idx}`} cx={pt.x} cy={pt.y} r="3.6" className="trend-point trend-users-point">
                    <title>{`${labels[idx]} | Users: ${pt.value}`}</title>
                  </circle>
                ))}
                {projectsPoints.map((pt, idx) => (
                  <circle key={`p-${labels[idx]}-${idx}`} cx={pt.x} cy={pt.y} r="3.6" className="trend-point trend-projects-point">
                    <title>{`${labels[idx]} | Projects: ${pt.value}`}</title>
                  </circle>
                ))}
                {contractsPoints.map((pt, idx) => (
                  <circle key={`c-${labels[idx]}-${idx}`} cx={pt.x} cy={pt.y} r="3.6" className="trend-point trend-contracts-point">
                    <title>{`${labels[idx]} | Contracts: ${pt.value}`}</title>
                  </circle>
                ))}

                {labels.map((label, idx) => {
                  const x = chartPad + (labels.length === 1 ? (chartW - chartPad * 2) / 2 : (idx * (chartW - chartPad * 2)) / (labels.length - 1));
                  return (
                    <text key={label} x={x} y={chartH - 8} className="trend-x-label" textAnchor="middle">
                      {label}
                    </text>
                  );
                })}
              </svg>

              <div className="trend-legend">
                <span><i className="legend-dot legend-users" /> Users</span>
                <span><i className="legend-dot legend-projects" /> Projects</span>
                <span><i className="legend-dot legend-contracts" /> Contracts</span>
              </div>
            </div>
          )}
        </div>

      </div>
    </AdminLayout>
  );
}

export default AdminDashboard;
