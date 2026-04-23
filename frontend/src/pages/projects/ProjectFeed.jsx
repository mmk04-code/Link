import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { Star } from 'lucide-react';
import '../../styles/ProjectFeed.css';

function ProjectFeed() {
  const MAX_BUDGET_LIMIT = 500000;
  const BUDGET_STEP = 1000;
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userRole, setUserRole] = useState(null);
  const [appliedProjectIds, setAppliedProjectIds] = useState(new Set());
  const [maxBudget, setMaxBudget] = useState(MAX_BUDGET_LIMIT);
  const [budgetInput, setBudgetInput] = useState(String(MAX_BUDGET_LIMIT));
  const [sortBy, setSortBy] = useState('newest');
  const [brokenImages, setBrokenImages] = useState({});
  const navigate = useNavigate();
  const location = useLocation();

  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('access');
      if (!token) {
        navigate('/');
        return;
      }
      const userRes = await axios.get('http://127.0.0.1:8000/api/users/me/', {
        headers: { Authorization: `Bearer ${token}` }
      });

      setUserRole(userRes.data.role);

      const role = (userRes.data.role || '').toUpperCase();
      const isMyProjectsPage = location.pathname === '/my-projects';
      const shouldUseMyProjects = role === 'CLIENT' || isMyProjectsPage;
      const projectsUrl = shouldUseMyProjects
        ? 'http://127.0.0.1:8000/api/projects/my/'
        : 'http://127.0.0.1:8000/api/projects/';

      const response = await axios.get(projectsUrl, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const fetchedProjects = Array.isArray(response.data) ? response.data : [];
      setProjects(fetchedProjects);

      if (userRes.data.role === 'FREELANCER') {
        const myProposalsRes = await axios.get('http://127.0.0.1:8000/api/proposals/my/', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const proposalList = Array.isArray(myProposalsRes.data) ? myProposalsRes.data : [];
        setAppliedProjectIds(new Set(proposalList.map((p) => Number(p.project))));
      } else {
        setAppliedProjectIds(new Set());
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [navigate, location.pathname]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const getInitials = (name) => {
    if (!name) return 'C';
    return name.charAt(0).toUpperCase();
  };

  const isImageBroken = (key) => !!brokenImages[key];
  const markImageBroken = (key) => {
    setBrokenImages((prev) => ({ ...prev, [key]: true }));
  };

  const getProjectBudget = (project) => {
    const value = project?.budget ?? project?.budget_max ?? project?.budget_min;
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : 0;
  };

  const getProjectCategory = (project) => {
    if (project?.category && String(project.category).trim()) return project.category;

    const title = String(project?.title || '').toLowerCase();
    const description = String(project?.description || '').toLowerCase();
    const skills = String(project?.skills_required || '').toLowerCase();
    const searchable = `${title} ${description} ${skills}`;

    const hasAny = (keywords) => keywords.some((keyword) => searchable.includes(keyword));

    if (hasAny(['mobile app', 'app development', 'flutter', 'react native', 'android', 'ios', 'swift', 'kotlin'])) {
      return 'App Development';
    }

    if (hasAny(['data analytics', 'analytics', 'power bi', 'tableau', 'data science', 'machine learning', 'ml', 'ai'])) {
      return 'Data Analytics';
    }

    if (hasAny(['ui', 'ux', 'figma', 'wireframe', 'prototype', 'design system'])) {
      return 'UI/UX Design';
    }

    if (hasAny(['e-commerce', 'ecommerce', 'shopify', 'woocommerce', 'storefront', 'payment gateway'])) {
      return 'E-Commerce';
    }

    if (hasAny(['backend', 'api', 'django', 'node', 'express', 'spring', 'laravel'])) {
      return 'Backend Development';
    }

    if (hasAny(['frontend', 'react', 'vue', 'angular', 'next.js', 'html', 'css', 'javascript'])) {
      return 'Frontend Development';
    }

    if (skills.trim()) {
      return skills
        .split(',')[0]
        .trim()
        .replace(/\b\w/g, (char) => char.toUpperCase());
    }

    return 'General Development';
  };

  const filteredProjects = useMemo(() => {
    const filtered = projects.filter((project) => {
      if (userRole === 'FREELANCER' && appliedProjectIds.has(Number(project.id))) {
        return false;
      }

      // Treat selected value as target budget.
      // Show projects only when selected budget falls inside project budget range.
      if (maxBudget >= MAX_BUDGET_LIMIT) return true;

      const parsedMin = Number.parseFloat(project?.budget_min);
      const parsedMax = Number.parseFloat(project?.budget_max);
      const fallback = getProjectBudget(project);

      const minBudget = Number.isFinite(parsedMin) ? parsedMin : fallback;
      const maxBudgetForProject = Number.isFinite(parsedMax) ? parsedMax : fallback;
      const normalizedMin = Math.min(minBudget, maxBudgetForProject);
      const normalizedMax = Math.max(minBudget, maxBudgetForProject);

      return maxBudget >= normalizedMin && maxBudget <= normalizedMax;
    });

    if (sortBy === 'highest') {
      return [...filtered].sort((a, b) => getProjectBudget(b) - getProjectBudget(a));
    }

    if (sortBy === 'oldest') {
      return [...filtered].sort(
        (a, b) => new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime()
      );
    }

    return [...filtered].sort(
      (a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
    );
  }, [projects, maxBudget, sortBy, userRole, appliedProjectIds]);

  const normalizeBudget = (value) => {
    const parsed = Number.parseFloat(value);
    if (!Number.isFinite(parsed)) return 0;
    const clamped = Math.max(0, Math.min(MAX_BUDGET_LIMIT, parsed));
    return Math.round(clamped / BUDGET_STEP) * BUDGET_STEP;
  };

  const handleBudgetSliderChange = (e) => {
    const normalized = normalizeBudget(e.target.value);
    setMaxBudget(normalized);
    setBudgetInput(String(normalized));
  };

  const commitBudgetInput = (rawValue) => {
    const normalized = normalizeBudget(rawValue);
    setMaxBudget(normalized);
    setBudgetInput(String(normalized));
  };

  const handleBudgetInputChange = (e) => {
    const raw = e.target.value;
    // Keep input editable while typing and commit only valid numeric content.
    if (raw === '' || /^\d+$/.test(raw)) {
      setBudgetInput(raw);
      if (raw !== '') {
        setMaxBudget(normalizeBudget(raw));
      }
    }
  };

  const handleBudgetInputBlur = () => {
    commitBudgetInput(budgetInput === '' ? '0' : budgetInput);
  };

  const handleBudgetInputKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      commitBudgetInput(budgetInput === '' ? '0' : budgetInput);
    }
  };

  const clearFilters = () => {
    setMaxBudget(MAX_BUDGET_LIMIT);
    setBudgetInput(String(MAX_BUDGET_LIMIT));
  };

  if (loading) return (
    <div className="feed-loading">
      <div className="btn-spinner" style={{ borderColor: 'var(--brand)', borderTopColor: 'transparent', width: '24px', height: '24px' }}></div>
      <span style={{ marginLeft: '12px', color: 'var(--text-muted)' }}>Loading projects...</span>
    </div>
  );

  if (error) {
    return (
      <div className="feed-error-wrap">
        <p className="feed-error-text">{error}</p>
        <button className="feed-retry-btn" onClick={fetchProjects}>Try again</button>
      </div>
    );
  }

  return (
    <div className="project-feed-wrapper">
      {/* Single top-bar row: count | budget slider | sort */}
      <div className="feed-top-bar feed-top-bar-inline">
        <div className="feed-result-count">
          Showing <strong>{filteredProjects.length}</strong>{' '}
          {userRole === 'CLIENT' ? 'of your projects' : 'available projects'}
        </div>

        <div className="feed-budget-inline">
          <div className="feed-budget-top">
            <label className="feed-budget-label">
              Budget: ₹{maxBudget >= MAX_BUDGET_LIMIT ? '5L+' : maxBudget.toLocaleString()}
            </label>
            {maxBudget < MAX_BUDGET_LIMIT && (
              <button type="button" className="feed-clear-btn" onClick={clearFilters}>Clear</button>
            )}
          </div>

          <div className="feed-budget-controls">
            <input
              type="range"
              min="0"
              max={MAX_BUDGET_LIMIT}
              step={BUDGET_STEP}
              className="filter-slider feed-slider-inline"
              value={maxBudget}
              onChange={handleBudgetSliderChange}
            />
            <div className="feed-budget-manual-wrap">
              <span className="feed-budget-currency">₹</span>
              <input
                type="number"
                min="0"
                max={MAX_BUDGET_LIMIT}
                step={BUDGET_STEP}
                className="feed-budget-manual-input"
                value={budgetInput}
                onChange={handleBudgetInputChange}
                onBlur={handleBudgetInputBlur}
                onKeyDown={handleBudgetInputKeyDown}
                aria-label="Maximum budget"
              />
            </div>
          </div>
        </div>

        <div className="feed-sort">
          <select className="feed-sort-select" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="newest">Newest matched</option>
            <option value="highest">Highest budget</option>
            <option value="oldest">Oldest</option>
          </select>
        </div>
      </div>

      <div className="feed-project-list feed-project-list-full">
        {filteredProjects.length === 0 ? (
          <div className="feed-empty">
            <div className="empty-icon">📂</div>
            <h3>No projects available</h3>
            <p>There are no projects matching your criteria at the moment.</p>
            <button className="btn-clear-filters" onClick={clearFilters}>Reset Budget Filter</button>
          </div>
        ) : (
          filteredProjects.map(project => (
            <div key={project.id} className="saas-project-card" onClick={() => navigate(`/projects/${project.id}`)}>
              {(() => {
                const hasApplied = userRole === 'FREELANCER' && appliedProjectIds.has(Number(project.id));
                const canAcceptProposals = !!project.can_accept_proposals;
                const proposalBlockReason = project.proposal_block_reason || 'Proposals are closed for this project';
                return (
                  <>
              
              <div className="spc-top">
                <span className="spc-category">{getProjectCategory(project)}</span>
                <span className="spc-time">Posted recently</span>
              </div>

              <h3 className="spc-title">{project.title}</h3>

              <div className="spc-client">
                <div className="spc-client-avatar">
                  {project.client_profile_image && !isImageBroken(`project-client-${project.id}`) ? (
                    <img
                      className="spc-client-avatar-img"
                      src={project.client_profile_image}
                      alt={project.client_name || 'Client'}
                      onError={() => markImageBroken(`project-client-${project.id}`)}
                    />
                  ) : (
                    getInitials(project.client_name)
                  )}
                </div>
                <span className="spc-client-name">{project.client_name || 'Client'}</span>
                <span className="spc-client-rating"><Star size={12} strokeWidth={2} /> 4.9</span>
              </div>

              <p className="spc-desc">
                {project.description.length > 220
                  ? project.description.substring(0, 220) + '...'
                  : project.description}
              </p>

              <div className="spc-tags">
                {project.skills_required ? project.skills_required.split(',').map((skill, idx) => (
                  <span key={idx} className="skill-pill">{skill.trim()}</span>
                )) : (
                  <span className="skill-pill">General</span>
                )}
              </div>

              <div className="spc-bottom">
                <div className="spc-budget-info">
                  <span className="spc-amount">
                    {(project.bid_type || 'flexible') === 'fixed'
                      ? `₹${Number(project.budget_max || 0).toFixed(0)}`
                      : `₹${Number(project.budget_min || 0).toFixed(0)} - ₹${Number(project.budget_max || 0).toFixed(0)}`}
                  </span>
                  <span className="spc-type">Estimated Budget</span>
                </div>
                <div className="spc-actions">
                  <span className="spc-proposals">{Number(project.proposals_count || 0)} / {Number(project.max_proposals || 50)} proposals</span>
                    {hasApplied ? (
                      <button className="btn-saas-applied" disabled>
                        Applied ✓
                      </button>
                    ) : userRole === 'FREELANCER' && !canAcceptProposals ? (
                      <button className="btn-saas-applied" disabled title={proposalBlockReason}>
                        {proposalBlockReason}
                      </button>
                    ) : (
                      <button className="btn-saas-apply" onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/projects/${project.id}`);
                      }}>
                        {userRole === 'CLIENT' ? 'View Details' : 'Apply Now'}
                      </button>
                    )}
                </div>
              </div>

                  </>
                );
              })()}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default ProjectFeed;
