# Requirements Document

## Introduction

This document defines the requirements for adding a commenting feature to the micro-blogging app. Users will be able to add, view, and delete comments on posts in their feed, enabling richer conversations and engagement beyond likes.

## Glossary

- **Comment_System**: The subsystem responsible for managing comments on posts
- **Comment**: A text-based response to a post created by an authenticated user
- **Post**: An existing content item in the feed that can receive comments
- **User**: An authenticated account holder who can create and manage comments
- **Comment_API**: The backend Lambda functions handling comment operations
- **Comment_UI**: The frontend React components displaying and managing comments
- **Comments_Table**: The DynamoDB table storing comment data (already exists)

## Requirements

### Requirement 1: View Comments on Posts

**User Story:** As a user, I want to view all comments on a post, so that I can read the conversation and engagement from other users.

#### Acceptance Criteria

1. WHEN a post is displayed in the feed, THE Comment_UI SHALL display a comment count indicator
2. WHEN a user clicks the comment indicator, THE Comment_UI SHALL expand to show all comments for that post
3. THE Comment_API SHALL retrieve comments ordered by creation time (oldest first)
4. FOR ALL comments retrieved, THE Comment_UI SHALL display the commenter's username, comment text, and timestamp
5. WHEN no comments exist on a post, THE Comment_UI SHALL display a message indicating no comments yet

### Requirement 2: Create Comments

**User Story:** As an authenticated user, I want to add comments to posts, so that I can participate in conversations and share my thoughts.

#### Acceptance Criteria

1. WHEN viewing a post, THE Comment_UI SHALL display a comment input field for authenticated users
2. WHEN a user submits a comment, THE Comment_System SHALL validate the comment text is not empty
3. WHEN a user submits a comment, THE Comment_System SHALL validate the comment text does not exceed 500 characters
4. WHEN a valid comment is submitted, THE Comment_API SHALL store the comment with userId, postId, text, and createdAt timestamp
5. WHEN a comment is successfully created, THE Comment_UI SHALL display the new comment immediately without page refresh
6. WHEN a comment is successfully created, THE Comment_UI SHALL increment the comment count for that post
7. IF comment creation fails, THEN THE Comment_UI SHALL display an error message to the user

### Requirement 3: Delete Own Comments

**User Story:** As a user, I want to delete my own comments, so that I can remove content I no longer want visible.

#### Acceptance Criteria

1. WHEN a user views their own comment, THE Comment_UI SHALL display a delete button
2. WHEN a user views another user's comment, THE Comment_UI SHALL NOT display a delete button
3. WHEN a user clicks delete on their comment, THE Comment_UI SHALL prompt for confirmation
4. WHEN deletion is confirmed, THE Comment_API SHALL remove the comment from the Comments_Table
5. WHEN a comment is successfully deleted, THE Comment_UI SHALL remove the comment from display without page refresh
6. WHEN a comment is successfully deleted, THE Comment_UI SHALL decrement the comment count for that post
7. IF comment deletion fails, THEN THE Comment_UI SHALL display an error message to the user

### Requirement 4: Comment Authentication and Authorization

**User Story:** As the system, I want to enforce authentication and authorization for comment operations, so that only legitimate users can create and manage comments.

#### Acceptance Criteria

1. WHEN a user attempts to create a comment, THE Comment_API SHALL verify the user is authenticated via Cognito token
2. WHEN a user attempts to delete a comment, THE Comment_API SHALL verify the user owns that comment
3. IF an unauthenticated user attempts to create a comment, THEN THE Comment_API SHALL return a 401 Unauthorized response
4. IF a user attempts to delete another user's comment, THEN THE Comment_API SHALL return a 403 Forbidden response
5. WHEN authentication fails, THE Comment_UI SHALL redirect the user to the login page

### Requirement 5: Comment API Endpoints

**User Story:** As a developer, I want RESTful API endpoints for comment operations, so that the frontend can interact with the comment system.

#### Acceptance Criteria

1. THE Comment_API SHALL provide a GET endpoint at /posts/{postId}/comments to retrieve all comments for a post
2. THE Comment_API SHALL provide a POST endpoint at /posts/{postId}/comments to create a new comment
3. THE Comment_API SHALL provide a DELETE endpoint at /comments/{commentId} to delete a comment
4. FOR ALL endpoints, THE Comment_API SHALL return responses with appropriate CORS headers
5. FOR ALL endpoints, THE Comment_API SHALL return JSON formatted response bodies
6. WHEN a request succeeds, THE Comment_API SHALL return a 200 status code with the requested data
7. WHEN a request fails validation, THE Comment_API SHALL return a 400 status code with error details
8. WHEN a resource is not found, THE Comment_API SHALL return a 404 status code

### Requirement 6: Comment Data Persistence

**User Story:** As the system, I want to persist comment data reliably, so that comments are not lost and can be retrieved efficiently.

#### Acceptance Criteria

1. THE Comment_API SHALL store comments in the existing Comments_Table with id as the primary key
2. THE Comment_API SHALL use the existing GSI on postId and createdAt for efficient comment retrieval by post
3. WHEN storing a comment, THE Comment_API SHALL generate a unique UUID for the comment id
4. WHEN storing a comment, THE Comment_API SHALL record the userId, postId, text, and createdAt timestamp
5. WHEN retrieving comments for a post, THE Comment_API SHALL query using the postId GSI
6. WHEN retrieving comments for a post, THE Comment_API SHALL sort results by createdAt in ascending order

### Requirement 7: Comment UI Integration

**User Story:** As a user, I want the comment interface to integrate seamlessly with the existing feed, so that I can interact with comments without disrupting my browsing experience.

#### Acceptance Criteria

1. THE Comment_UI SHALL display comment functionality within each post card in the feed
2. THE Comment_UI SHALL use collapsible sections to show/hide comments without navigating away
3. THE Comment_UI SHALL maintain consistent styling with the existing purple accent theme
4. THE Comment_UI SHALL display loading states while fetching or submitting comments
5. THE Comment_UI SHALL handle errors gracefully with user-friendly messages
6. THE Comment_UI SHALL be responsive and functional on both mobile and desktop viewports

### Requirement 8: Comment Count Display

**User Story:** As a user, I want to see how many comments a post has, so that I can gauge the level of engagement and conversation.

#### Acceptance Criteria

1. THE Comment_UI SHALL display the total comment count on each post card
2. WHEN comments are loaded, THE Comment_UI SHALL update the count based on the number of comments retrieved
3. WHEN a new comment is added, THE Comment_UI SHALL increment the displayed count immediately
4. WHEN a comment is deleted, THE Comment_UI SHALL decrement the displayed count immediately
5. THE Comment_UI SHALL display the count in a format consistent with the existing like count display

