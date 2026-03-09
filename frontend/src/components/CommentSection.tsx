import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { commentsApi } from '../services/api';
import { Comment } from '../types/comment';
import CommentList from './CommentList';
import CommentForm from './CommentForm';

interface CommentSectionProps {
  postId: string;
  initialCount: number;
}

const CommentSection: React.FC<CommentSectionProps> = ({ postId, initialCount }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [commentCount, setCommentCount] = useState(initialCount);
  const { user, token } = useAuth();

  const fetchComments = async () => {
    if (!token) {
      setError('You must be logged in to view comments');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const { comments: fetchedComments } = await commentsApi.getComments(postId, token);
      setComments(fetchedComments);
      setCommentCount(fetchedComments.length);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load comments');
      console.error('Error fetching comments:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = async () => {
    if (!isExpanded) {
      // Expanding - fetch comments
      await fetchComments();
    }
    setIsExpanded(!isExpanded);
  };

  const handleCommentCreated = (newComment: Comment) => {
    // Optimistic UI update: add comment immediately
    setComments((prevComments) => [...prevComments, newComment]);
    setCommentCount((prevCount) => prevCount + 1);
  };

  const handleCommentDelete = async (commentId: string) => {
    if (!token) {
      throw new Error('You must be logged in to delete comments');
    }

    // Optimistic UI update: remove comment immediately
    const commentToDelete = comments.find((c) => c.id === commentId);
    setComments((prevComments) => prevComments.filter((c) => c.id !== commentId));
    setCommentCount((prevCount) => prevCount - 1);

    try {
      await commentsApi.deleteComment(commentId, token);
    } catch (err) {
      // Rollback on error
      if (commentToDelete) {
        setComments((prevComments) => [...prevComments, commentToDelete]);
        setCommentCount((prevCount) => prevCount + 1);
      }
      throw err;
    }
  };

  return (
    <div className="comment-section">
      <button className="comment-toggle" onClick={handleToggle}>
        <span className="comment-icon">💬</span>
        <span className="comment-count">{commentCount}</span>
        <span className="comment-label">
          {isExpanded ? 'Hide comments' : 'Show comments'}
        </span>
      </button>

      {isExpanded && (
        <div className="comment-section-content">
          {error && <div className="error-message">{error}</div>}

          <CommentList
            comments={comments}
            currentUserId={user?.id || ''}
            onDelete={handleCommentDelete}
            isLoading={isLoading}
          />

          {user && token && (
            <CommentForm postId={postId} onCommentCreated={handleCommentCreated} />
          )}
        </div>
      )}
    </div>
  );
};

export default CommentSection;
