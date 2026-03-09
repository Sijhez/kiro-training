# Micro Blogging App

A serverless social media platform built on AWS that enables users to share short posts, follow other users, and engage with content through likes and comments.

## Features

- User authentication and profile management
- Create and share posts
- Follow/unfollow other users
- Like posts and view engagement metrics
- Comment on posts
- Real-time follower counts
- Responsive design for mobile and desktop

## Tech Stack

- **Frontend**: React 18 + TypeScript, Vite, React Router
- **Backend**: Node.js Lambda functions, AWS SDK v3
- **Infrastructure**: AWS CDK v2
- **Database**: DynamoDB
- **Authentication**: AWS Cognito
- **Hosting**: S3 + CloudFront

## Project Structure

```
micro-blogging-app/
├── frontend/          # React SPA
├── backend/           # Lambda functions
├── infrastructure/    # AWS CDK stack
└── package.json       # Yarn workspace root
```

## Getting Started

### Prerequisites

- Node.js 22.x
- Yarn
- AWS CLI configured
- AWS CDK CLI

### Installation

```bash
# Install dependencies
yarn install
```

### Configuration

1. Deploy infrastructure:
```bash
yarn deploy:infra
```

2. Copy the CDK outputs to `frontend/.env`:
```
VITE_API_URL=<your-api-gateway-url>
VITE_USER_POOL_ID=<your-user-pool-id>
VITE_USER_POOL_CLIENT_ID=<your-client-id>
VITE_IDENTITY_POOL_ID=<your-identity-pool-id>
```

### Development

```bash
# Start frontend dev server
yarn start:frontend
```

### Deployment

```bash
# Full deployment (infrastructure + frontend)
yarn deploy
```

## License

MIT
