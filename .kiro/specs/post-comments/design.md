# Design Document: Post Comments Feature

## Overview

The post comments feature enables users to engage in threaded conversations on posts within the micro-blogging application. This feature extends the existing social interaction capabilities (likes, follows) by allowing users to add text-based comments to any post in their feed.

The design leverages the existing serverless architecture with AWS Lambda functions for the backend API, DynamoDB for data persistence using the pre-existing CommentsTable, and React components for the frontend UI. The implementation follows established patterns in the codebase including the withAuth middleware for authentication, centralized API client structure, and feature-based Lambda organization.

Key capabilities include:
- Viewing comments on posts with chronological ordering (oldest first)
- Creating comments with validation (non-empty, max 500 characters)
- Deleting own comments with confirmation
- Real-time comment count updates
- Seamless integration with existing feed UI

## Architecture

### System Components

The comment system consists of three primary layers:

1. **Frontend Layer (React/TypeScript)**
   - CommentSection component: Manages comment display and interactions
   - CommentList component: Renders the list of comments
   - CommentForm component: Handles comment creation input
   - CommentItem component: Displays individual comments with delete capability
   - API client extensions in services/api.ts

2. **Backend Layer (Node.js Lambda)**
   - getComments: Retrieves comments for a specific post
   - createComment: Creates a new comment with validation
   - deleteComment: Deletes a comment with ownership verification

3. **Data Layer (DynamoDB)**
   - CommentsTable: Existing table with id (PK) and postId-createdAt GSI
   - Schema: { id, postId, userId, text, createdAt }

### Data Flow

**Comment Retrieval Flow:**
```
User clicks comment icon → CommentSection expands → 
API call to GET /posts/{postId}/comments → 
Lambda queries CommentsTable via postId GSI → 
Returns sorted comments → UI renders CommentList
```

**Comment Creation Flow:**
```
User types comment → Submits form → 
Frontend validates non-empty → 
API call to POST /posts/{postId}/comments → 
Lambda validates (auth, length) → 
Stores in CommentsTable → 
Returns new comment → UI updates list and count
```

**Comment Deletion Flow:**
```
User clicks delete on own comment → Confirmation dialog → 
API call to DELETE /comments/{commentId} → 
Lambda verifies ownership → 
Deletes from CommentsTable → 
UI removes comment and decrements count
```

### Integration Points

- **Authentication**: Uses existing withAuth middleware to verify Cognito tokens
- **User Data**: Fetches usernames from UsersTable for comment display
- **Post Data**: Comments are associated with posts via postId foreign key
- **API Gateway**: New endpoints added to existing REST API structure
- **Frontend State**: Integrates with existing AuthContext for user identity

## Components and Interfaces

### Frontend Components

#### CommentSection Component
```typescript
interface CommentSectionProps {
  postId: string;
  initialCount: number;
}

interface CommentSectionState {
  isExpanded: boolean;
  comments: Comment[];
  isLoading: boolean;
  error: string | null;
  commentCount: number;
}
```

Responsibilities:
- Toggle comment visibility
- Fetch comments when expanded
- Manage comment count state
- Coordinate between CommentList and CommentForm

#### CommentList Component
```typescript
interface CommentListProps {
  comments: Comment[];
  currentUserId: string;
  onDelete: (commentId: string) => Promise<void>;
}
```

Responsibilities:
- Render list of CommentItem components
- Display "no comments" message when empty
- Handle loading states

#### CommentForm Component
```typescript
interface CommentFormProps {
  postId: string;
  onCommentCreated: (comment: Comment) => void;
}

interface CommentFormState {
  text: string;
  isSubmitting: boolean;
  error: string | null;
}
```

Responsibilities:
- Manage comment input field
- Validate character limit (500 chars)
- Submit comment via API
- Clear form on success

#### CommentItem Component
```typescript
interface CommentItemProps {
  comment: Comment;
  currentUserId: string;
  onDelete: (commentId: string) => Promise<void>;
}
```

Responsibilities:
- Display comment text, username, timestamp
- Show delete button for own comments
- Handle delete confirmation dialog

### Backend Lambda Functions

#### getComments Handler
```javascript
// GET /posts/{postId}/comments
exports.handler = async (event) => {
  const { postId } = event.pathParameters;
  
  // Query CommentsTable using postId-index GSI
  // Sort by createdAt ascending
  // Join with UsersTable to get usernames
  
  return {
    statusCode: 200,
    body: JSON.stringify({ comments })
  };
};
```

#### createComment Handler
```javascript
// POST /posts/{postId}/comments
exports.handler = withAuth(async (event) => {
  const { postId } = event.pathParameters;
  const { text } = JSON.parse(event.body);
  const userId = event.user.id;
  
  // Validate text (non-empty, max 500 chars)
  // Generate UUID for comment id
  // Store in CommentsTable
  
  return {
    statusCode: 201,
    body: JSON.stringify({ comment })
  };
});
```

#### deleteComment Handler
```javascript
// DELETE /comments/{commentId}
exports.handler = withAuth(async (event) => {
  const { commentId } = event.pathParameters;
  const userId = event.user.id;
  
  // Fetch comment from CommentsTable
  // Verify userId matches comment.userId
  // Delete from CommentsTable
  
  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'Comment deleted' })
  };
});
```

### API Client Extensions

```typescript
// frontend/src/services/api.ts
export const commentsApi = {
  getComments: async (postId: string, token: string): Promise<{ comments: Comment[] }>,
  createComment: async (postId: string, text: string, token: string): Promise<{ comment: Comment }>,
  deleteComment: async (commentId: string, token: string): Promise<void>
};
```

### Type Definitions

```typescript
// frontend/src/types/comment.ts
export interface Comment {
  id: string;
  postId: string;
  userId: string;
  username: string;  // Joined from UsersTable
  text: string;
  createdAt: string;  // ISO 8601 timestamp
}
```

## Data Models

### CommentsTable Schema (Existing)

**Table Structure:**
- Partition Key: `id` (String) - UUID of the comment
- GSI: `postId-index`
  - Partition Key: `postId` (String)
  - Sort Key: `createdAt` (String) - ISO 8601 timestamp

**Item Attributes:**
```javascript
{
  id: "uuid-v4",              // Primary key
  postId: "uuid-v4",          // Foreign key to PostsTable
  userId: "uuid-v4",          // Foreign key to UsersTable
  text: "string",             // Comment content (max 500 chars)
  createdAt: "ISO-8601"       // Timestamp for sorting
}
```

**Access Patterns:**
1. Get all comments for a post (ordered by time): Query postId-index with postId, sort by createdAt ASC
2. Get single comment by ID: GetItem with id
3. Delete comment by ID: DeleteItem with id

**Indexes:**
- Primary: id (for direct lookups and deletes)
- GSI: postId + createdAt (for retrieving post comments in chronological order)

### Data Validation Rules

**Comment Text:**
- Must not be empty or whitespace-only
- Maximum length: 500 characters
- Trimmed before storage

**Comment Ownership:**
- userId must match authenticated user for creation
- userId must match comment.userId for deletion

**Timestamps:**
- createdAt: Generated server-side using `new Date().toISOString()`
- Immutable after creation

## Error Handling

### Backend Error Responses

**400 Bad Request:**
- Empty comment text
- Comment exceeds 500 characters
- Missing required fields
- Invalid JSON in request body

**401 Unauthorized:**
- Missing authentication token
- Invalid or expired token
- Token verification failure

**403 Forbidden:**
- User attempting to delete another user's comment

**404 Not Found:**
- Comment ID does not exist (for delete operations)
- Post ID does not exist (for create operations)

**500 Internal Server Error:**
- DynamoDB operation failures
- Unexpected server errors

### Frontend Error Handling

**Network Errors:**
- Display user-friendly message: "Unable to load comments. Please try again."
- Retry mechanism for transient failures
- Maintain UI state during errors

**Validation Errors:**
- Real-time character count display (e.g., "450/500")
- Disable submit button when text is empty or exceeds limit
- Show inline error message for validation failures

**Authentication Errors:**
- Redirect to login page on 401 responses
- Clear local auth state
- Preserve intended action for post-login redirect

**Delete Confirmation:**
- Modal dialog: "Are you sure you want to delete this comment?"
- Cancel and Confirm buttons
- Show loading state during deletion

### Error Recovery Strategies

1. **Optimistic UI Updates**: Update UI immediately, rollback on failure
2. **Graceful Degradation**: Show cached data if fetch fails
3. **User Feedback**: Clear error messages with actionable guidance
4. **Logging**: Console errors for debugging, CloudWatch logs for backend

## Testing Strategy

The testing strategy employs a dual approach combining unit tests for specific scenarios and property-based tests for comprehensive input coverage.

### Unit Testing

**Backend Lambda Functions:**
- Test framework: Jest
- Mock AWS SDK clients (DynamoDB, Cognito)
- Test cases:
  - Successful comment creation with valid input
  - Successful comment retrieval with multiple comments
  - Successful comment deletion by owner
  - Validation errors (empty text, exceeds 500 chars)
  - Authorization errors (missing token, wrong owner)
  - Database error handling

**Frontend Components:**
- Test framework: Vitest + React Testing Library
- Test cases:
  - CommentSection expands/collapses correctly
  - CommentForm validates character limit
  - CommentForm disables submit when empty
  - CommentItem shows delete button only for own comments
  - Delete confirmation dialog appears
  - Error messages display correctly
  - Loading states render properly

### Property-Based Testing

Property-based tests will use **fast-check** for JavaScript/TypeScript to verify universal properties across randomized inputs.

**Configuration:**
- Minimum 100 iterations per property test
- Each test tagged with: `Feature: post-comments, Property {number}: {property_text}`

**Test Data Generators:**
- Random comment text (0-1000 chars, including edge cases)
- Random user IDs and post IDs (valid UUIDs)
- Random timestamps (valid ISO 8601 strings)
- Random comment collections (0-100 comments per post)

### Integration Testing

**API Integration:**
- Test complete request/response cycles
- Verify CORS headers on all endpoints
- Test authentication flow end-to-end
- Verify DynamoDB queries return expected results

**UI Integration:**
- Playwright e2e tests for critical user flows:
  - View comments on a post
  - Create a comment and see it appear
  - Delete own comment and see count update
  - Verify non-owners cannot delete comments

### Performance Testing

**Load Considerations:**
- Test comment retrieval with 100+ comments
- Verify pagination if implemented
- Test concurrent comment creation
- Monitor Lambda cold start times
- Verify DynamoDB query performance with GSI


## Correctness Properties

A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.

### Property 1: Comment Chronological Ordering

*For any* set of comments retrieved for a post, the comments should be ordered by their createdAt timestamp in ascending order (oldest first).

**Validates: Requirements 1.3**

### Property 2: Comment Display Completeness

*For any* comment rendered in the UI, the displayed output should contain the commenter's username, the comment text, and the timestamp.

**Validates: Requirements 1.4**

### Property 3: Empty Comment Rejection

*For any* string that is empty or composed entirely of whitespace characters, submitting it as a comment should be rejected by the system, and no comment should be created.

**Validates: Requirements 2.2**

### Property 4: Character Limit Enforcement

*For any* string exceeding 500 characters, submitting it as a comment should be rejected with a 400 Bad Request response.

**Validates: Requirements 2.3**

### Property 5: Comment Persistence Completeness

*For any* successfully created comment, the stored record in the CommentsTable should contain all required fields: id, userId, postId, text, and createdAt.

**Validates: Requirements 2.4, 6.1, 6.4**

### Property 6: Optimistic UI Update on Creation

*For any* successfully created comment, the comment should immediately appear in the comment list without requiring a page refresh.

**Validates: Requirements 2.5**

### Property 7: Comment Count Increment on Creation

*For any* successful comment creation, the displayed comment count for that post should increase by exactly 1.

**Validates: Requirements 2.6, 8.3**

### Property 8: Delete Button Ownership Visibility

*For any* comment displayed in the UI, a delete button should be visible if and only if the comment's userId matches the current authenticated user's id.

**Validates: Requirements 3.1, 3.2**

### Property 9: Comment Deletion Persistence

*For any* comment that exists in the CommentsTable, when deletion is confirmed by the owner, the comment should no longer exist in the database.

**Validates: Requirements 3.4**

### Property 10: Optimistic UI Update on Deletion

*For any* successfully deleted comment, the comment should immediately be removed from the comment list without requiring a page refresh.

**Validates: Requirements 3.5**

### Property 11: Comment Count Decrement on Deletion

*For any* successful comment deletion, the displayed comment count for that post should decrease by exactly 1.

**Validates: Requirements 3.6, 8.4**

### Property 12: Authentication Enforcement for Creation

*For any* comment creation request without a valid Cognito authentication token, the API should return a 401 Unauthorized response and no comment should be created.

**Validates: Requirements 4.1, 4.3**

### Property 13: Authorization Enforcement for Deletion

*For any* comment deletion request where the authenticated user's id does not match the comment's userId, the API should return a 403 Forbidden response and the comment should not be deleted.

**Validates: Requirements 4.2, 4.4**

### Property 14: CORS Headers on All Responses

*For any* API endpoint response (GET, POST, DELETE), the response headers should include appropriate CORS headers including Access-Control-Allow-Origin.

**Validates: Requirements 5.4**

### Property 15: JSON Response Format

*For any* API endpoint response, the response body should be valid JSON that can be parsed without errors.

**Validates: Requirements 5.5**

### Property 16: Success Response Status Codes

*For any* valid API request that completes successfully, the response status code should be 200 (for GET/DELETE) or 201 (for POST).

**Validates: Requirements 5.6**

### Property 17: Validation Error Status Codes

*For any* API request that fails input validation (empty text, exceeds character limit, missing fields), the response status code should be 400 Bad Request.

**Validates: Requirements 5.7**

### Property 18: Not Found Status Codes

*For any* API request for a resource that does not exist (e.g., deleting a non-existent comment), the response status code should be 404 Not Found.

**Validates: Requirements 5.8**

### Property 19: UUID Format for Comment IDs

*For any* newly created comment, the generated id field should be a valid UUID v4 format.

**Validates: Requirements 6.3**

### Property 20: Loading State Display During Async Operations

*For any* asynchronous operation (fetching comments, creating comment, deleting comment), the UI should display a loading indicator while the operation is in progress.

**Validates: Requirements 7.4**

### Property 21: Comment Count Accuracy

*For any* set of comments loaded for a post, the displayed comment count should equal the length of the comments array.

**Validates: Requirements 8.2**

### Property 22: Comment Creation Round Trip

*For any* valid comment text and postId, creating a comment and then immediately fetching comments for that post should return a list that includes the newly created comment with matching text and postId.

**Validates: Requirements 2.4, 2.5** (Round-trip property for data persistence and retrieval)

### Property 23: Comment Deletion Idempotence

*For any* comment that has been successfully deleted, attempting to delete it again should return a 404 Not Found response, and the comment count should not change.

**Validates: Requirements 3.4, 5.8** (Idempotence property for deletion)
