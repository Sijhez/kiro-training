# Technology Stack

## Build System

Yarn workspaces monorepo with three packages: frontend, backend, and infrastructure.

## Frontend Stack

- React 18 with TypeScript
- Vite for build tooling and dev server
- React Router for navigation
- ESLint for code quality
- Playwright for e2e testing

## Backend Stack

- Node.js 22.x runtime (Lambda)
- AWS SDK v3 for AWS service interactions
- CommonJS modules (require/exports)
- Jest for testing

## Infrastructure Stack

- AWS CDK v2 with TypeScript
- AWS services: Lambda, API Gateway, DynamoDB, Cognito, S3, CloudFront
- TypeScript compilation with ts-node

## Key Libraries

- `@aws-sdk/client-cognito-identity-provider` - User authentication
- `@aws-sdk/client-dynamodb` and `@aws-sdk/lib-dynamodb` - Database operations
- `uuid` - ID generation
- `react-router-dom` - Client-side routing

## Common Commands

### Development
```bash
# Start frontend dev server
yarn start:frontend

# Start backend locally (if configured)
yarn start:backend
```

### Building
```bash
# Build frontend
yarn build:frontend

# Build backend (copies src to dist, removes .ts files)
yarn build:backend

# Build infrastructure
yarn workspace infrastructure build
```

### Deployment
```bash
# Deploy infrastructure stack
yarn deploy:infra

# Deploy frontend to S3
yarn deploy:frontend

# Invalidate CloudFront cache
yarn invalidate:cdn

# Full deployment (build + deploy all)
yarn deploy
```

### Testing
```bash
# Run e2e tests
yarn workspace frontend test:e2e

# Run e2e tests with UI
yarn workspace frontend test:e2e:ui

# Lint frontend code
yarn workspace frontend lint
```

### Infrastructure
```bash
# View infrastructure changes
yarn workspace infrastructure diff

# Deploy infrastructure
yarn workspace infrastructure deploy
```

## Environment Configuration

Frontend requires `.env` file with:
- `VITE_API_URL` - API Gateway endpoint
- `VITE_USER_POOL_ID` - Cognito User Pool ID
- `VITE_USER_POOL_CLIENT_ID` - Cognito Client ID
- `VITE_IDENTITY_POOL_ID` - Cognito Identity Pool ID

These values are output by CDK deployment.
