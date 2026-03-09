# Project Structure

## Monorepo Organization

```
micro-blogging-app/
├── frontend/          # React SPA
├── backend/           # Lambda functions
├── infrastructure/    # AWS CDK stack
└── package.json       # Workspace root
```

## Frontend Structure

```
frontend/
├── src/
│   ├── components/    # Reusable UI components
│   ├── contexts/      # React contexts (AuthContext)
│   ├── pages/         # Route-level components
│   ├── services/      # API client and utilities
│   ├── types/         # TypeScript type definitions
│   ├── App.tsx        # Main app component with routing
│   └── main.tsx       # Entry point
├── .env               # Environment variables
├── vite.config.ts     # Vite configuration
└── playwright.config.ts
```

### Frontend Conventions

- Pages represent routes (Login, Register, Feed, Profile, CreatePost)
- AuthContext provides authentication state and methods
- Protected routes use ProtectedRoute wrapper component
- Layout component provides consistent header/navigation
- API calls centralized in `services/api.ts`

## Backend Structure

```
backend/
├── src/
│   ├── common/
│   │   └── middleware.js    # Auth middleware (withAuth)
│   └── functions/
│       ├── auth/            # Authentication handlers
│       ├── users/           # User management handlers
│       ├── posts/           # Post management handlers
│       └── monitoring/      # Metrics and monitoring
└── scripts/                 # Deployment scripts
```

### Backend Conventions

- Each Lambda function is a separate file with `exports.handler`
- Functions use AWS SDK v3 modular imports
- CommonJS module system (require/exports)
- Middleware pattern with `withAuth` for protected endpoints
- Environment variables for table names and Cognito config
- Standard response format with CORS headers

### Lambda Response Pattern

```javascript
return {
  statusCode: 200,
  headers: {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Credentials': true,
  },
  body: JSON.stringify({ /* data */ }),
};
```

## Infrastructure Structure

```
infrastructure/
├── lib/
│   └── app-stack.ts    # Main CDK stack definition
├── bin/                # CDK app entry point
└── cdk.json            # CDK configuration
```

### Infrastructure Conventions

- Single stack (`AppStack`) defines all resources
- Lambda packages expected in `backend/dist/lambda-packages/*.zip`
- Resources: Cognito, DynamoDB tables, API Gateway, Lambda, S3, CloudFront
- DynamoDB tables use GSIs for query patterns
- API Gateway endpoints follow REST conventions
- CDK outputs provide frontend environment variables

## DynamoDB Schema

### Tables and Indexes

- **UsersTable**: `id` (PK), GSI on `username`
- **PostsTable**: `id` (PK), GSI on `userId` + `createdAt`
- **LikesTable**: `userId` (PK) + `postId` (SK), GSI on `postId`
- **CommentsTable**: `id` (PK), GSI on `postId` + `createdAt`
- **FollowsTable**: `followerId` (PK) + `followeeId` (SK), GSI on `followeeId`

## API Routes

```
/auth/register          POST   - User registration
/auth/login             POST   - User login
/users/{userId}         GET    - Get user profile
/users/{userId}         PUT    - Update profile (auth)
/users/{userId}/follow  POST   - Follow user (auth)
/users/{userId}/unfollow POST  - Unfollow user (auth)
/users/{userId}/following GET  - Check following status (auth)
/users/{userId}/posts   GET    - Get user's posts
/posts                  GET    - Get feed posts
/posts                  POST   - Create post (auth)
/posts/{postId}/like    POST   - Like/unlike post (auth)
```

## Naming Conventions

- **Files**: camelCase for JS/TS files (e.g., `createPost.js`)
- **Components**: PascalCase for React components (e.g., `CreatePost.tsx`)
- **Functions**: camelCase for functions and variables
- **Constants**: UPPER_SNAKE_CASE for environment variables
- **CSS Classes**: kebab-case (e.g., `app-header`, `post-card`)

## Code Organization Principles

- Feature-based organization for Lambda functions
- Component-based organization for React UI
- Shared utilities in `common/` directories
- Types co-located with usage in frontend
- Infrastructure as code in dedicated workspace
- Deployment scripts at workspace level
