# Contributing

## Branching

- main: stable branch
- feature branches: feature/<short-topic>
- fix branches: fix/<short-topic>

## Commit Messages

Follow Conventional Commits:

- feat(scope): new feature
- fix(scope): bug fix
- refactor(scope): code structure change without behavior change
- docs(scope): documentation updates
- chore(scope): maintenance updates

Examples:

- feat(accounts): add /api/auth/login endpoint
- fix(auth): return 401 on invalid token
- refactor(backend-structure): move auth logic under apps/accounts
- docs(readme): add setup and API sections

## Pull Request Checklist

- code builds and runs locally
- migrations included when models change
- README updated if setup or API changed
- no secrets or environment files committed
- node_modules and venv not committed
