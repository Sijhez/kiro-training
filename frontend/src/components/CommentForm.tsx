import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { commentsApi } from '../services/api';
import { Comment } from '../types/comment';

const MAX_COMMENT_LENGTH = 500;

interface CommentFormProps {
  postId: string;
  onCommentCreated: (comment: Comment) => void;
}

const CommentForm: React.FC<CommentFormProps> = ({ postId, onCommentCreated }) => {
  const [text, setText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!text.trim()) {
      setError('Comment cannot be empty');
      return;
    }

    if (text.length > MAX_COMMENT_LENGTH) {
      setError(`Comment cannot exceed ${MAX_COMMENT_LENGTH} characters`);
      return;
    }

    if (!token) {
      setError('You must be logged in to comment');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const { comment } = await commentsApi.createComment(postId, text, token);
      
      // Clear form on success
      setText('');
      
      // Notify parent component
      onCommentCreated(comment);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create comment');
      console.error('Error creating comment:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isTextEmpty = !text.trim();
  const isTextTooLong = text.length > MAX_COMMENT_LENGTH;
  const isSubmitDisabled = isSubmitting || isTextEmpty || isTextTooLong;

  return (
    <form className="comment-form" onSubmit={handleSubmit}>
      {error && <div className="error-message">{error}</div>}

      <div className="form-group">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Write a comment..."
          rows={3}
          disabled={isSubmitting}
        />
        <div className="character-count">
          {text.length}/{MAX_COMMENT_LENGTH}
        </div>
      </div>

      <button type="submit" disabled={isSubmitDisabled}>
        {isSubmitting ? 'Posting...' : 'Post Comment'}
      </button>
    </form>
  );
};

export default CommentForm;
