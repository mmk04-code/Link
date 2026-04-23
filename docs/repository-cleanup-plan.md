# Repository Cleanup Plan

## Professional Naming

Recommended repository name:

- talentlink-marketplace

Why:

- Clear domain context
- Easy to read and remember
- Suitable for resume and interview references

## Backend Reorganization

Target layout:

- backend/config
- backend/apps/accounts
- backend/apps/projects
- backend/common

Actions:

- Keep backend/apps/accounts as the only auth domain
- Add backend/apps/projects when project APIs are migrated
- Move reusable permission and utility helpers into backend/common
- Keep backend/talentlink only temporarily, then remove after final migration

## Frontend Reorganization

Target layout:

- frontend/src/app
- frontend/src/api
- frontend/src/auth
- frontend/src/pages
- frontend/src/components

Actions:

- Move app bootstrap and routes into src/app
- Move API client logic into src/api
- Move token and auth session logic into src/auth
- Keep route pages in src/pages and shared UI in src/components

## Cleanup Strategy

### Remove

- backend/node_modules
- frontend/node_modules
- backend/venv
- temporary scripts not used by app runtime
- duplicate or legacy files after migration completion

### Keep

- backend/config
- backend/apps/accounts
- frontend/src/pages
- frontend/src/components
- root requirements.txt
- root README.md

### Refactor

- backend/apps/accounts/urls.py:
  - keep auth-focused routes only
- backend/config/settings.py:
  - load sensitive values from environment
- frontend/src/pages/Login.jsx and Register.jsx:
  - centralize API calls and token handling
- frontend/src/components/ProtectedRoute.jsx:
  - enforce authenticated route behavior consistently

## What To Delete, Rename, Reorganize

Delete when migration is complete:

- backend/contracts
- backend/messaging
- backend/notifications
- backend/reviews
- backend/dashboard
- backend/models

Rename:

- repository: Link -> talentlink-marketplace

Reorganize:

- all active backend domains under backend/apps
- all frontend domain concerns under frontend/src/app, api, auth, pages, components

## Commit Standards

Use Conventional Commits:

- feat: add login endpoint under accounts
- fix: resolve JWT auth header parsing in axios
- refactor: move user routes into accounts urls module
- docs: rewrite README setup and architecture sections
- chore: update gitignore and environment templates

Scope format:

- feat(accounts): add register serializer validation
- fix(frontend-auth): handle expired access token redirect

## Environment and Setup Standards

- keep .env.example files in backend and frontend
- never commit .env files
- keep dependency pins in requirements.txt
- update README setup steps whenever scripts or folder structure change
