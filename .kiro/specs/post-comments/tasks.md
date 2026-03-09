# Implementation Plan: Post Comments Feature

## Overview

This plan implements a commenting system for posts in the micro-blogging app. The implementation follows a bottom-up approach: backend API first (data layer and Lambda functions), then frontend components (UI layer), and finally integration and testing. This ensures each layer can be validated before building on top of it.

The feature uses the existing CommentsTable in DynamoDB, follows established patterns (withAuth middleware, centralized API client), and integrates seamlessly with the current feed UI.

## Tasks

- [ ] 1. Set up backend Lambda functions and API endpoints
  - [x] 1.1 Implement getComments Lambda function
    - Create `backend/src/functions/comments/getComments.js`
    - Query CommentsTable using postId-index GSI
    - Sort comments by createdAt in ascending order
    - Join with UsersTable to fetch usernames for each comment
    - Return comments array with proper CORS headers
    - _Requirements: 1.3, 1.4, 5.1, 5.4, 5.5, 5.6, 6.2, 6.5, 6.6_

  - [ ]* 1.2 Write property test for getComments chronological ordering
    - **Property 1: Comment Chronological Ordering**
    - **Validates: Requirements 1.3**

  - [ ]* 1.3 Write unit tests for getComments
    - Test successful retrieval with multiple comments
    - Test empty comments array for post with no comments
    - Test error handling for invalid postId
    - _Requirements: 1.3, 1.4, 1.5_

  - [x] 1.4 Implement createComment Lambda function
    - Create `backend/src/functions/comments/createComment.js`
    - Use withAuth middleware for authentication
    - Validate comment text is non-empty and trimmed
    - Validate comment text does not exceed 500 characters
    - Generate UUID v4 for comment id
    - Store comment in CommentsTable with userId, postId, text, createdAt
    - Return created comment with 201 status code
    - _Requirements: 2.2, 2.3, 2.4, 4.1, 4.3, 5.2, 5.4, 5.5, 5.6, 5.7, 6.1, 6.3, 6.4_

  - [ ]* 1.5 Write property tests for createComment validation
    - **Property 3: Empty Comment Rejection**
    - **Validates: Requirements 2.2**
    - **Property 4: Character Limit Enforcement**
    - **Validates: Requirements 2.3**
    - **Property 5: Comment Persistence Completeness**
    - **Validates: Requirements 2.4, 6.1, 6.4**
    - **Property 12: Authentication Enforcement for Creation**
    - **Validates: Requirements 4.1, 4.3**
    - **Property 19: UUID Format for Comment IDs**
    - **Validates: Requirements 6.3**

  - [ ]* 1.6 Write unit tests for createComment
    - Test successful comment creation with valid input
    - Test rejection of empty or whitespace-only text
    - Test rejection of text exceeding 500 characters
    - Test 401 response for missing authentication token
    - Test proper field storage in DynamoDB
    - _Requirements: 2.2, 2.3, 2.4, 4.1, 4.3_

  - [x] 1.7 Implement deleteComment Lambda function
    - Create `backend/src/functions/comments/deleteComment.js`
    - Use withAuth middleware for authentication
    - Fetch comment from CommentsTable by commentId
    - Verify authenticated userId matches comment.userId
    - Return 403 Forbidden if user does not own comment
    - Return 404 Not Found if comment does not exist
    - Delete comment from CommentsTable
    - Return success response with 200 status code
    - _Requirements: 3.4, 4.2, 4.4, 5.3, 5.4, 5.5, 5.6, 5.8_

  - [ ]* 1.8 Write property tests for deleteComment authorization
    - **Property 9: Comment Deletion Persistence**
    - **Validates: Requirements 3.4**
    - **Property 13: Authorization Enforcement for Deletion**
    - **Validates: Requirements 4.2, 4.4**
    - **Property 18: Not Found Status Codes**
    - **Validates: Requirements 5.8**
    - **Property 23: Comment Deletion Idempotence**
    - **Validates: Requirements 3.4, 5.8**

  - [ ]* 1.9 Write unit tests for deleteComment
    - Test successful deletion by comment owner
    - Test 403 response when non-owner attempts deletion
    - Test 404 response for non-existent comment
    - Test idempotent deletion (deleting already deleted comment)
    - _Requirements: 3.4, 4.2, 4.4, 5.8_

- [ ] 2. Update infrastructure to wire Lambda functions to API Gateway
  - [x] 2.1 Add comment Lambda functions to CDK stack
    - Update `infrastructure/lib/app-stack.ts`
    - Create Lambda functions for getComments, createComment, deleteComment
    - Grant DynamoDB read/write permissions to CommentsTable and UsersTable
    - Configure environment variables (table names)
    - _Requirements: 5.1, 5.2, 5.3_

  - [x] 2.2 Add API Gateway routes for comment endpoints
    - Add GET /posts/{postId}/comments route to getComments Lambda
    - Add POST /posts/{postId}/comments route to createComment Lambda
    - Add DELETE /comments/{commentId} route to deleteComment Lambda
    - Configure CORS for all routes
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [x] 3. Checkpoint - Deploy and test backend API
  - Deploy infrastructure changes with `yarn deploy:infra`
  - Test each endpoint manually using curl or Postman
  - Verify authentication and authorization work correctly
  - Ensure all tests pass, ask the user if questions arise

- [ ] 4. Implement frontend type definitions and API client
  - [x] 4.1 Create Comment type definition
    - Create `frontend/src/types/comment.ts`
    - Define Comment interface with id, postId, userId, username, text, createdAt
    - Export type for use across components
    - _Requirements: 1.4, 2.4_

  - [x] 4.2 Extend API client with comment methods
    - Update `frontend/src/services/api.ts`
    - Add getComments(postId, token) method
    - Add createComment(postId, text, token) method
    - Add deleteComment(commentId, token) method
    - Handle authentication headers and error responses
    - _Requirements: 5.1, 5.2, 5.3, 4.5_

  - [ ]* 4.3 Write property tests for API client
    - **Property 14: CORS Headers on All Responses**
    - **Validates: Requirements 5.4**
    - **Property 15: JSON Response Format**
    - **Validates: Requirements 5.5**
    - **Property 16: Success Response Status Codes**
    - **Validates: Requirements 5.6**
    - **Property 17: Validation Error Status Codes**
    - **Validates: Requirements 5.7**

- [ ] 5. Implement CommentItem component
  - [x] 5.1 Create CommentItem component
    - Create `frontend/src/components/CommentItem.tsx`
    - Display comment username, text, and formatted timestamp
    - Show delete button only when currentUserId matches comment.userId
    - Implement delete confirmation dialog
    - Handle delete action with loading state
    - Style with purple accent theme and responsive design
    - _Requirements: 1.4, 3.1, 3.2, 3.3, 7.3, 7.6_

  - [ ]* 5.2 Write property test for delete button visibility
    - **Property 8: Delete Button Ownership Visibility**
    - **Validates: Requirements 3.1, 3.2**

  - [ ]* 5.3 Write unit tests for CommentItem
    - Test delete button shows only for own comments
    - Test delete confirmation dialog appears on click
    - Test delete action calls onDelete callback
    - Test proper rendering of username, text, timestamp
    - _Requirements: 1.4, 3.1, 3.2, 3.3_

- [ ] 6. Implement CommentForm component
  - [x] 6.1 Create CommentForm component
    - Create `frontend/src/components/CommentForm.tsx`
    - Implement controlled input field for comment text
    - Display character count (e.g., "450/500")
    - Disable submit button when text is empty or exceeds 500 chars
    - Show inline validation errors
    - Handle form submission with loading state
    - Call onCommentCreated callback on success
    - Display error messages on failure
    - Clear form after successful submission
    - _Requirements: 2.1, 2.2, 2.3, 2.7, 7.3, 7.4, 7.5, 7.6_

  - [ ]* 6.2 Write unit tests for CommentForm
    - Test character count display updates correctly
    - Test submit button disabled when text empty or exceeds limit
    - Test form clears after successful submission
    - Test error message displays on API failure
    - Test loading state during submission
    - _Requirements: 2.1, 2.2, 2.3, 2.7, 7.4, 7.5_

- [ ] 7. Implement CommentList component
  - [x] 7.1 Create CommentList component
    - Create `frontend/src/components/CommentList.tsx`
    - Render array of CommentItem components
    - Display "No comments yet" message when comments array is empty
    - Handle loading state with skeleton or spinner
    - Pass currentUserId and onDelete to each CommentItem
    - _Requirements: 1.4, 1.5, 7.4, 7.6_

  - [ ]* 7.2 Write property test for comment display completeness
    - **Property 2: Comment Display Completeness**
    - **Validates: Requirements 1.4**

  - [ ]* 7.3 Write unit tests for CommentList
    - Test renders correct number of CommentItem components
    - Test displays "no comments" message when empty
    - Test loading state renders correctly
    - _Requirements: 1.4, 1.5, 7.4_

- [ ] 8. Implement CommentSection component
  - [x] 8.1 Create CommentSection component
    - Create `frontend/src/components/CommentSection.tsx`
    - Display comment count indicator with icon
    - Implement expand/collapse toggle functionality
    - Fetch comments from API when expanded
    - Manage comment count state (increment on create, decrement on delete)
    - Integrate CommentList and CommentForm components
    - Handle loading and error states
    - Implement optimistic UI updates for create and delete
    - Style with collapsible section and purple theme
    - _Requirements: 1.1, 1.2, 2.5, 2.6, 3.5, 3.6, 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 8.1, 8.2, 8.3, 8.4_

  - [ ]* 8.2 Write property tests for CommentSection state management
    - **Property 6: Optimistic UI Update on Creation**
    - **Validates: Requirements 2.5**
    - **Property 7: Comment Count Increment on Creation**
    - **Validates: Requirements 2.6, 8.3**
    - **Property 10: Optimistic UI Update on Deletion**
    - **Validates: Requirements 3.5**
    - **Property 11: Comment Count Decrement on Deletion**
    - **Validates: Requirements 3.6, 8.4**
    - **Property 20: Loading State Display During Async Operations**
    - **Validates: Requirements 7.4**
    - **Property 21: Comment Count Accuracy**
    - **Validates: Requirements 8.2**

  - [ ]* 8.3 Write unit tests for CommentSection
    - Test expand/collapse toggle works correctly
    - Test comments fetched when section expands
    - Test comment count increments on successful creation
    - Test comment count decrements on successful deletion
    - Test optimistic UI updates and rollback on failure
    - Test error handling and display
    - _Requirements: 1.1, 1.2, 2.5, 2.6, 3.5, 3.6, 7.4, 7.5, 8.3, 8.4_

- [ ] 9. Integrate CommentSection into Feed
  - [x] 9.1 Add CommentSection to post cards in Feed
    - Update Feed page component to import CommentSection
    - Add CommentSection component to each post card
    - Pass postId and initialCount (0 or fetched count) as props
    - Ensure styling integrates seamlessly with existing post card layout
    - Test responsive behavior on mobile and desktop
    - _Requirements: 7.1, 7.2, 7.3, 7.6, 8.1_

  - [ ]* 9.2 Write integration tests for Feed with comments
    - Test CommentSection renders for each post
    - Test multiple posts can have comments expanded simultaneously
    - Test comment interactions don't affect other posts
    - _Requirements: 7.1, 7.2_

- [x] 10. Checkpoint - Test frontend integration
  - Run frontend locally with `yarn start:frontend`
  - Manually test complete user flows (view, create, delete comments)
  - Verify responsive design on different screen sizes
  - Ensure all tests pass, ask the user if questions arise

- [ ] 11. Add end-to-end property-based tests
  - [ ]* 11.1 Write E2E property test for comment round trip
    - **Property 22: Comment Creation Round Trip**
    - **Validates: Requirements 2.4, 2.5**
    - Use Playwright to create comment and verify it appears in list

  - [ ]* 11.2 Write E2E tests for complete user flows
    - Test authenticated user can view, create, and delete comments
    - Test unauthenticated user redirected to login when attempting to comment
    - Test user cannot delete another user's comment
    - Test comment count updates correctly throughout interactions
    - _Requirements: 1.1, 1.2, 2.1, 2.5, 3.1, 3.2, 3.3, 4.5, 8.3, 8.4_

- [x] 12. Final checkpoint and deployment
  - Run all unit tests with `yarn workspace frontend test` and `yarn workspace backend test`
  - Run E2E tests with `yarn workspace frontend test:e2e`
  - Build and deploy backend with `yarn build:backend && yarn deploy:infra`
  - Build and deploy frontend with `yarn build:frontend && yarn deploy:frontend`
  - Invalidate CDN cache with `yarn invalidate:cdn`
  - Ensure all tests pass, ask the user if questions arise

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP delivery
- Each task references specific requirements for traceability
- Backend implementation comes first to enable frontend development against real APIs
- Checkpoints ensure incremental validation at key milestones
- Property tests validate universal correctness properties using fast-check
- Unit tests validate specific examples and edge cases
- E2E tests validate complete user workflows
- The existing CommentsTable and withAuth middleware are reused, no new infrastructure needed beyond Lambda wiring
