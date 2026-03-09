const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, QueryCommand, BatchGetCommand } = require('@aws-sdk/lib-dynamodb');

// Initialize clients
const ddbClient = new DynamoDBClient();
const ddbDocClient = DynamoDBDocumentClient.from(ddbClient);

/**
 * Lambda handler for getting comments for a specific post
 * @param {Object} event - API Gateway event
 * @returns {Object} - API Gateway response with comments array
 */
const handler = async (event) => {
  try {
    const commentsTableName = process.env.COMMENTS_TABLE;
    const usersTableName = process.env.USERS_TABLE;
    
    if (!commentsTableName) {
      throw new Error('COMMENTS_TABLE environment variable is not set');
    }
    if (!usersTableName) {
      throw new Error('USERS_TABLE environment variable is not set');
    }

    // Get postId from path parameters
    const { postId } = event.pathParameters || {};
    
    if (!postId) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Credentials': true,
        },
        body: JSON.stringify({
          message: 'Missing postId parameter',
        }),
      };
    }

    // Query CommentsTable using postId-index GSI
    const queryCommand = new QueryCommand({
      TableName: commentsTableName,
      IndexName: 'postId-index',
      KeyConditionExpression: 'postId = :postId',
      ExpressionAttributeValues: {
        ':postId': postId,
      },
      ScanIndexForward: true, // Sort by createdAt in ascending order (oldest first)
    });

    const result = await ddbDocClient.send(queryCommand);
    const comments = result.Items || [];

    // If no comments, return empty array
    if (comments.length === 0) {
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Credentials': true,
        },
        body: JSON.stringify({
          comments: [],
        }),
      };
    }

    // Extract unique user IDs from comments
    const userIds = [...new Set(comments.map(comment => comment.userId))];

    // Batch get usernames from UsersTable
    const batchGetCommand = new BatchGetCommand({
      RequestItems: {
        [usersTableName]: {
          Keys: userIds.map(userId => ({ id: userId })),
        },
      },
    });

    const usersResult = await ddbDocClient.send(batchGetCommand);
    const users = usersResult.Responses?.[usersTableName] || [];

    // Create a map of userId to username for quick lookup
    const userMap = {};
    users.forEach(user => {
      userMap[user.id] = user.username || 'Unknown';
    });

    // Join comments with usernames
    const commentsWithUsernames = comments.map(comment => ({
      id: comment.id,
      postId: comment.postId,
      userId: comment.userId,
      username: userMap[comment.userId] || 'Unknown',
      text: comment.text,
      createdAt: comment.createdAt,
    }));

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true,
      },
      body: JSON.stringify({
        comments: commentsWithUsernames,
      }),
    };
  } catch (error) {
    console.error('Error getting comments:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true,
      },
      body: JSON.stringify({
        message: 'Error getting comments',
        error: error.message || 'Unknown error',
      }),
    };
  }
};

// Export the handler (no auth required for reading comments)
exports.handler = handler;
