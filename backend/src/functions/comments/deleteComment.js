const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand, DeleteCommand } = require('@aws-sdk/lib-dynamodb');
const { withAuth } = require('../../common/middleware');

// Initialize clients
const ddbClient = new DynamoDBClient();
const ddbDocClient = DynamoDBDocumentClient.from(ddbClient);

/**
 * Lambda handler for deleting a comment
 * @param {Object} event - API Gateway event with user info added by auth middleware
 * @returns {Object} - API Gateway response
 */
const handler = async (event) => {
  try {
    // Extract commentId from path parameters
    const { commentId } = event.pathParameters || {};
    if (!commentId) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Credentials': true,
        },
        body: JSON.stringify({ message: 'Missing commentId parameter' }),
      };
    }

    // Get table name from environment
    const commentsTableName = process.env.COMMENTS_TABLE;
    if (!commentsTableName) {
      throw new Error('COMMENTS_TABLE environment variable is not set');
    }

    // Fetch comment from CommentsTable
    const getCommand = new GetCommand({
      TableName: commentsTableName,
      Key: {
        id: commentId,
      },
    });
    
    const result = await ddbDocClient.send(getCommand);

    // Return 404 if comment does not exist
    if (!result.Item) {
      return {
        statusCode: 404,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Credentials': true,
        },
        body: JSON.stringify({ message: 'Comment not found' }),
      };
    }

    // Verify authenticated userId matches comment.userId
    if (result.Item.userId !== event.user.id) {
      return {
        statusCode: 403,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Credentials': true,
        },
        body: JSON.stringify({ message: 'Forbidden: You do not own this comment' }),
      };
    }

    // Delete comment from CommentsTable
    const deleteCommand = new DeleteCommand({
      TableName: commentsTableName,
      Key: {
        id: commentId,
      },
    });
    
    await ddbDocClient.send(deleteCommand);

    // Return success response with 200 status code
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true,
      },
      body: JSON.stringify({
        message: 'Comment deleted successfully',
      }),
    };
  } catch (error) {
    console.error('Error deleting comment:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true,
      },
      body: JSON.stringify({
        message: 'Error deleting comment',
        error: error.message || 'Unknown error',
      }),
    };
  }
};

// Export the handler wrapped with authentication middleware
exports.handler = withAuth(handler);
