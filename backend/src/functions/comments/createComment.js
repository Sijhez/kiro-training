const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');
const { v4: uuidv4 } = require('uuid');
const { withAuth } = require('../../common/middleware');

// Initialize clients
const ddbClient = new DynamoDBClient();
const ddbDocClient = DynamoDBDocumentClient.from(ddbClient);

/**
 * Lambda handler for creating a new comment on a post
 * @param {Object} event - API Gateway event with user info added by auth middleware
 * @returns {Object} - API Gateway response
 */
const handler = async (event) => {
  try {
    // Validate request body exists
    if (!event.body) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Credentials': true,
        },
        body: JSON.stringify({ message: 'Missing request body' }),
      };
    }

    // Extract postId from path parameters
    const { postId } = event.pathParameters || {};
    if (!postId) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Credentials': true,
        },
        body: JSON.stringify({ message: 'Missing postId parameter' }),
      };
    }

    // Parse request body
    const { text } = JSON.parse(event.body);
    
    // Validate comment text is non-empty after trimming
    if (!text || text.trim() === '') {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Credentials': true,
        },
        body: JSON.stringify({ message: 'Comment text cannot be empty' }),
      };
    }
    
    // Validate comment text does not exceed 500 characters
    const MAX_COMMENT_LENGTH = 500;
    if (text.length > MAX_COMMENT_LENGTH) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Credentials': true,
        },
        body: JSON.stringify({ message: `Comment text cannot exceed ${MAX_COMMENT_LENGTH} characters` }),
      };
    }
    
    // Get table name from environment
    const commentsTableName = process.env.COMMENTS_TABLE;
    if (!commentsTableName) {
      throw new Error('COMMENTS_TABLE environment variable is not set');
    }

    // Create comment with UUID v4 for id
    const commentId = uuidv4();
    const timestamp = new Date().toISOString();
    
    const comment = {
      id: commentId,
      postId,
      userId: event.user.id,
      text: text.trim(),
      createdAt: timestamp,
    };

    // Store comment in CommentsTable
    const putCommand = new PutCommand({
      TableName: commentsTableName,
      Item: comment,
    });
    
    await ddbDocClient.send(putCommand);

    // Return created comment with 201 status code
    return {
      statusCode: 201,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true,
      },
      body: JSON.stringify({
        message: 'Comment created successfully',
        comment,
      }),
    };
  } catch (error) {
    console.error('Error creating comment:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true,
      },
      body: JSON.stringify({
        message: 'Error creating comment',
        error: error.message || 'Unknown error',
      }),
    };
  }
};

// Export the handler wrapped with authentication middleware
exports.handler = withAuth(handler);
