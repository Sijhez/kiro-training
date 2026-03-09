import React from 'react';
import { Comment } from '../types/comment';
import CommentItem from './CommentItem';

interface CommentListProps {
  comments: Comment[];
  currentUserId: string;
  onDelete: (commentId: string) => Promise<void>;
  isLoading?: boolean;
}

const CommentList: React.FC<CommentListProps> = ({ 
  comments, 
  currentUserId, 
  onDelete,
  isLoading = false 
}) => {
  if (isLoading) {
    return (
      <div className="comment-list-loading">
        <div className="loading-spinner">Loading comments...</div>
      </div>
    );
  }

  if (comments.length === 0) {
    return (
      <div className="comment-list-empty">
        <p>No comments yet. Be the first to comment!</p>
      </div>
    );
  }

  return (
    <div className="comment-list">
      {comments.map((comment) => (
        <CommentItem
          key={comment.id}
          comment={comment}
          currentUserId={currentUserId}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
};

export default CommentList;
