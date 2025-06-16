import React, { useEffect, useState, useCallback } from 'react';
import api from '../utils/api';
import useUserStore from '../store/userStore';

export default function Comments({ taskId }) {
  const { user } = useUserStore();
  const [comments, setComments] = useState([]);
  const [content, setContent] = useState('');

  const fetchComments = useCallback(() => {
    api.get(`/comments/${taskId}`).then(res => setComments(res.data));
  }, [taskId]);

  useEffect(() => {
    if (user && taskId) fetchComments();
    // Optionally, add real-time updates here
  }, [user, taskId, fetchComments]);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    await api.post(`/comments/${taskId}`, { content });
    setContent('');
    fetchComments();
  };

  if (!user) return null;
  return (
    <div>
      <div className="font-bold mb-2">Comments</div>
      <ul className="space-y-2 text-sm mb-2">
        {comments.map(c => (
          <li key={c._id} className="p-2 rounded bg-gray-100">
            <span className="font-semibold">{c.author?.name || 'User'}:</span> {c.content}
            <span className="float-right text-xs text-gray-400">{new Date(c.createdAt).toLocaleString()}</span>
          </li>
        ))}
      </ul>
      <form onSubmit={handleAdd} className="flex gap-2">
        <input value={content} onChange={e => setContent(e.target.value)} placeholder="Add a comment..." className="border p-2 rounded w-full" />
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">Send</button>
      </form>
    </div>
  );
} 