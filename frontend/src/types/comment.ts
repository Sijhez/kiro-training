export interface Comment {
  id: string;
  postId: string;
  userId: string;
  username: string;  // Joined from UsersTable
  text: string;
  createdAt: string;  // ISO 8601 timestamp
}
