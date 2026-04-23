# TalentLink Marketplace

TalentLink is a freelance marketplace where clients post work and freelancers submit proposals, collaborate, and close contracts. This repository is being rebuilt in milestone-based phases to improve architecture, API consistency, and production readiness.

## Recommended Repository Name

talentlink-marketplace

## Overview

This project focuses on one practical hiring workflow: account onboarding, role-aware access, and project lifecycle operations. The current milestone prioritizes a stable authentication foundation and a cleaner codebase layout before feature expansion.

## Tech Stack

- Backend: Django, Django REST Framework
- Authentication: JWT with DRF authentication classes
- Database: SQLite for development
- Frontend: React, React Router, Axios
- Tooling: npm, pip, GitHub

## Features

### Implemented

- Custom user model with role field (CLIENT or FREELANCER)
- Registration endpoint
- Current user endpoint
- Profile and verification request APIs
- React app with dashboard-oriented pages and route structure

### Planned (Milestone Next)

- Dedicated login endpoint under /api/auth/login
- Frontend auth flow hardening with route guards and token refresh strategy
- Role-based dashboard redirects after login
- Core workflow hardening: create project or submit proposal

## Architecture

High-level flow:

1. React client calls Django REST APIs through Axios.
2. Django authenticates users using JWT auth classes.
3. Business logic is grouped under backend apps, starting with accounts.
4. Frontend routing isolates pages and reusable components for maintainability.

## Project Structure

Current repository layout:

- backend
	- config: Django settings and URL root
	- apps
		- accounts: user model, profile, verification APIs
	- common: shared utilities namespace
	- legacy modules retained during migration: contracts, messaging, reviews, dashboard
- frontend
	- src
		- components: shared UI and routing helpers
		- pages: route-level views
		- styles: page and component styling

Target clean layout:

- backend
	- config
	- apps
		- accounts
		- projects
	- common
- frontend/src
	- app
	- api
	- auth
	- pages
	- components

## Installation

### 1. Clone

git clone https://github.com/mmk04-code/Link.git
cd Link

### 2. Backend setup

cd backend
python -m venv .venv
.venv\\Scripts\\activate
pip install -r ..\\requirements.txt
copy .env.example .env
python manage.py migrate
python manage.py runserver

### 3. Frontend setup

cd ../frontend
npm install
copy .env.example .env
npm start

## API Endpoints

Base URL: http://127.0.0.1:8000

Auth and user endpoints:

- POST /api/auth/register/
- GET /api/auth/me/
- GET /api/auth/profile/
- PATCH /api/auth/profile/
- GET /api/auth/verification/status/
- POST /api/auth/verification/request/

Admin verification endpoints:

- GET /api/auth/verification/admin/requests/
- GET /api/auth/verification/admin/requests/{request_id}/
- POST /api/auth/verification/requests/{request_id}/decision/

## Current Status

- Phase 1 structure normalization completed.
- Auth domain has been consolidated under accounts.
- Legacy modules still exist in repository and are being incrementally de-scoped from runtime wiring.

## Future Enhancements

- Finalize login endpoint and token refresh flow under /api/auth
- Introduce projects app under backend/apps with focused APIs
- Add automated backend and frontend tests in CI
- Add Docker development setup
- Add API schema documentation

## Demo

- Live demo: Coming soon
- Demo video: Coming soon

