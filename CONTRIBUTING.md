# Contributing

## Development Workflow

1. Fork the repository and clone locally
2. Create a feature branch from `dev`: `git checkout -b feat/your-feature`
3. Make changes, write tests, ensure all checks pass
4. Open a pull request targeting `dev`

## Branch Strategy

| Branch | Purpose | Auto-deploy |
|--------|---------|-------------|
| `dev` | Active development | → dev environment |
| `staging` | Pre-production testing | → staging environment |
| `main` | Production | → prod environment |

Never commit directly to `main` or `staging`.

## Commit Convention

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add scholarship search endpoint
fix: correct cache TTL calculation
docs: update deployment guide
test: add feedback handler unit tests
refactor: extract AI routing logic
chore: bump vitest to 2.2.0
```

## Before Opening a PR

```bash
# Backend
cd backend
npm run typecheck   # 0 errors
npm run lint        # 0 warnings
npm run test        # all tests pass

# Frontend
cd frontend
npm run typecheck
npm run lint
npm run test        # unit tests pass

# Terraform
cd infrastructure
terraform fmt -check -recursive
```

## Adding a New Lambda Function

1. Create handler in `backend/src/functions/<domain>/index.ts`
2. Use `createHandler()` from `shared/middleware/handler.ts`
3. Add unit tests in `backend/tests/unit/<domain>.test.ts`
4. Register the function in `infrastructure/modules/lambda/main.tf`
5. Add API Gateway route in `infrastructure/modules/api-gateway/main.tf`

## Environment Variables

Never hardcode secrets. Add new variables to:
- `.env.example` (with placeholder value)
- `backend/src/shared/types/env.ts` (typed accessor)
- `infrastructure/modules/lambda/variables.tf` (Terraform input)
- GitHub Actions secrets (for CI/CD)
