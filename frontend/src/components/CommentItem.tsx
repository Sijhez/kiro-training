import React, { useState } from 'react';
import { Comment } from '../types/comment';

interface CommentItemProps {
  comment: Comment;
  currentUserId: string;
  onDelete: (commentId: string) => Promise<void>;
}

const CommentItem: React.FC<CommentItemProps> = ({ comment, currentUserId, onDelete }) => {
  const [isDeleting, setIsDeleting] = useState(false);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this comment?')) {
      return;
    }

    setIsDeleting(true);
    try {
      await onDelete(comment.id);
    } catch (error) {
      console.error('Error deleting comment:', error);
      setIsDeleting(false);
    }
  };

  const isOwnComment = comment.userId === currentUserId;

  return (
    <div className="comment-item">
      <div className="comment-header">
        <span className="comment-username">{comment.username}</span>
        <span className="comment-date">{formatDate(comment.createdAt)}</span>
      </div>
      <div className="comment-text">{comment.text}</div>
      {isOwnComment && (
        <div className="comment-actions">
          <button
            onClick={handleDelete}
            className="delete-comment-button"
            disabled={isDeleting}
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      )}
    </div>
  );
};

export default CommentItem;
