import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, MapPin, MessageCircle, Trash2, Edit3, Save, User } from 'lucide-react';
import { CalendarEvent } from '../types/Event';
import { Comment } from '../types/Comment';

interface EventPopupProps {
  event: CalendarEvent;
  onSave: (eventData: Omit<CalendarEvent, 'id' | 'comments'>) => void;
  onDelete: (eventId: string) => void;
  onClose: () => void;
  onAddComment: (eventId: string, comment: string, author: string) => void;
  onDeleteComment: (eventId: string, commentId: string) => void;
  currentUser: any;
}

export const EventPopup: React.FC<EventPopupProps> = ({
  event,
  onSave,
  onDelete,
  onClose,
  onAddComment,
  onDeleteComment,
  currentUser
}) => {
  const [isEditing, setIsEditing] = useState(!event.id);
  const [title, setTitle] = useState(event.title);
  const [description, setDescription] = useState(event.description);
  const [date, setDate] = useState(event.date instanceof Date ? event.date.toISOString().split('T')[0] : event.date);
  const [time, setTime] = useState(event.time);
  const [venue, setVenue] = useState(event.venue);
  const [newComment, setNewComment] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState<string | null>(null);
  const [localComments, setLocalComments] = useState<Comment[]>(event.comments || []);

  // Check if current user is admin
  const isAdmin = currentUser?.role === 'admin';

  // Update local comments when event changes
  useEffect(() => {
    setLocalComments(event.comments || []);
  }, [event.comments]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const handleSave = () => {
    if (!title.trim()) return;

    const eventData = {
      title: title.trim(),
      description: description.trim(),
      date: new Date(date),
      time,
      venue: venue.trim()
    };

    onSave(eventData);
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (event.id && isAdmin) {
      onDelete(event.id);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !currentUser || !event.id) return;

    // Create optimistic comment for instant UI update
    const optimisticComment: Comment = {
      id: `temp-${Date.now()}`,
      text: newComment.trim(),
      author: currentUser.name || currentUser.username,
      timestamp: new Date(),
      created_at: new Date().toISOString()
    };

    // Update local state immediately for instant feedback
    setLocalComments(prev => [...prev, optimisticComment]);
    setNewComment('');

    try {
      // Call the parent handler to save to database
      await onAddComment(event.id, newComment.trim(), currentUser.name || currentUser.username);
    } catch (error) {
      // If save fails, remove the optimistic comment
      setLocalComments(prev => prev.filter(c => c.id !== optimisticComment.id));
      setNewComment(newComment.trim()); // Restore the comment text
      console.error('Failed to add comment:', error);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!event.id) return;

    // Optimistically remove comment from local state
    const commentToRemove = localComments.find(c => c.id === commentId);
    setLocalComments(prev => prev.filter(c => c.id !== commentId));
    setCommentToDelete(null);

    try {
      await onDeleteComment(event.id, commentId);
    } catch (error) {
      // If delete fails, restore the comment
      if (commentToRemove) {
        setLocalComments(prev => [...prev, commentToRemove].sort((a, b) => 
          new Date(a.created_at || a.timestamp).getTime() - new Date(b.created_at || b.timestamp).getTime()
        ));
      }
      console.error('Failed to delete comment:', error);
    }
  };

  const formatDate = (dateValue: Date | string) => {
    const d = dateValue instanceof Date ? dateValue : new Date(dateValue);
    return d.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const formatTime = (timeValue: string) => {
    const [hours, minutes] = timeValue.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
      <div className="bg-gradient-to-br from-stone-900/95 to-amber-900/20 border-2 border-amber-700/50 rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col academic-shadow backdrop-blur-md">
        {/* Fixed Header */}
        <div className="flex-shrink-0 bg-gradient-to-r from-stone-900/95 via-amber-900/30 to-stone-800/95 text-amber-100 p-6 rounded-t-xl border-b-2 border-amber-700/40">
          <div className="absolute inset-0 bg-gradient-to-r from-amber-900/10 to-stone-900/20 rounded-t-xl"></div>
          <div className="relative flex items-center justify-between">
            <h2 className="text-2xl font-bold font-['Playfair_Display'] drop-shadow-lg">
              {isEditing ? (event.id ? 'Edit Event' : 'Create Event') : 'Event Details'}
            </h2>
            <div className="flex items-center space-x-2">
              {!isEditing && event.id && isAdmin && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="p-3 hover:bg-amber-800/30 rounded-lg transition-all duration-300 backdrop-blur-sm border border-amber-700/30 academic-shadow"
                  title="Edit Event"
                >
                  <Edit3 className="w-5 h-5" />
                </button>
              )}
              {event.id && isAdmin && (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="p-3 hover:bg-red-700/40 rounded-lg transition-all duration-300 backdrop-blur-sm border border-red-600/30 academic-shadow"
                  title="Delete Event (Admin Only)"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              )}
              <button
                onClick={onClose}
                className="p-3 hover:bg-stone-700/40 rounded-lg transition-all duration-300 backdrop-blur-sm border border-stone-600/30 academic-shadow"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8">
          {isEditing ? (
            <div className="space-y-6">
              <div>
                <label className="block text-amber-200 text-sm font-bold mb-3 font-['Source_Serif_Pro']">
                  Event Title *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-stone-800/60 border-2 border-stone-700/50 rounded-lg px-4 py-3 text-amber-100 placeholder-amber-300/60 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30 font-['Crimson_Text'] backdrop-blur-sm academic-shadow"
                  placeholder="Enter event title..."
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-amber-200 text-sm font-bold mb-3 font-['Source_Serif_Pro']">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  className="w-full bg-stone-800/60 border-2 border-stone-700/50 rounded-lg px-4 py-3 text-amber-100 placeholder-amber-300/60 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30 font-['Crimson_Text'] backdrop-blur-sm academic-shadow resize-none"
                  placeholder="Enter event description..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-amber-200 text-sm font-bold mb-3 font-['Source_Serif_Pro']">
                    Date
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-stone-800/60 border-2 border-stone-700/50 rounded-lg px-4 py-3 text-amber-100 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30 font-['Crimson_Text'] backdrop-blur-sm academic-shadow"
                  />
                </div>

                <div>
                  <label className="block text-amber-200 text-sm font-bold mb-3 font-['Source_Serif_Pro']">
                    Time
                  </label>
                  <input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full bg-stone-800/60 border-2 border-stone-700/50 rounded-lg px-4 py-3 text-amber-100 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30 font-['Crimson_Text'] backdrop-blur-sm academic-shadow"
                  />
                </div>
              </div>

              <div>
                <label className="block text-amber-200 text-sm font-bold mb-3 font-['Source_Serif_Pro']">
                  Venue
                </label>
                <input
                  type="text"
                  value={venue}
                  onChange={(e) => setVenue(e.target.value)}
                  className="w-full bg-stone-800/60 border-2 border-stone-700/50 rounded-lg px-4 py-3 text-amber-100 placeholder-amber-300/60 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30 font-['Crimson_Text'] backdrop-blur-sm academic-shadow"
                  placeholder="Enter event venue..."
                />
              </div>

              <div className="flex justify-end space-x-4 pt-6 border-t-2 border-amber-700/30">
                <button
                  onClick={() => {
                    if (event.id) {
                      setIsEditing(false);
                    } else {
                      onClose();
                    }
                  }}
                  className="px-6 py-3 text-amber-200 hover:text-amber-100 transition-all duration-300 font-['Source_Serif_Pro'] font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={!title.trim()}
                  className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-amber-700/80 to-amber-800/80 text-amber-100 rounded-lg hover:from-amber-600/90 hover:to-amber-700/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 font-['Source_Serif_Pro'] font-semibold academic-shadow backdrop-blur-sm border border-amber-600/50"
                >
                  <Save className="w-5 h-5" />
                  <span>Save Event</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              <div>
                <h3 className="text-3xl font-bold text-amber-100 mb-4 font-['Playfair_Display'] drop-shadow-lg">
                  {event.title}
                </h3>
                {event.description && (
                  <p className="text-amber-200/90 leading-relaxed font-['Crimson_Text'] text-lg">
                    {event.description}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex items-center space-x-4 p-4 bg-gradient-to-br from-amber-900/30 to-stone-800/40 rounded-lg border border-amber-700/30 backdrop-blur-sm academic-shadow">
                  <Calendar className="w-6 h-6 text-amber-400" />
                  <div>
                    <div className="text-sm text-amber-300/80 font-['Source_Serif_Pro'] font-semibold">Date</div>
                    <div className="font-bold text-amber-100 font-['Crimson_Text']">
                      {formatDate(event.date)}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-4 p-4 bg-gradient-to-br from-amber-900/30 to-stone-800/40 rounded-lg border border-amber-700/30 backdrop-blur-sm academic-shadow">
                  <Clock className="w-6 h-6 text-amber-400" />
                  <div>
                    <div className="text-sm text-amber-300/80 font-['Source_Serif_Pro'] font-semibold">Time</div>
                    <div className="font-bold text-amber-100 font-['Crimson_Text']">
                      {formatTime(event.time)}
                    </div>
                  </div>
                </div>

                {event.venue && (
                  <div className="flex items-center space-x-4 p-4 bg-gradient-to-br from-amber-900/30 to-stone-800/40 rounded-lg border border-amber-700/30 backdrop-blur-sm academic-shadow">
                    <MapPin className="w-6 h-6 text-amber-400" />
                    <div>
                      <div className="text-sm text-amber-300/80 font-['Source_Serif_Pro'] font-semibold">Venue</div>
                      <div className="font-bold text-amber-100 font-['Crimson_Text']">
                        {event.venue}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Admin Notice */}
              {!isAdmin && (
                <div className="bg-amber-900/20 border border-amber-700/30 rounded-lg p-4 backdrop-blur-sm">
                  <p className="text-amber-200/80 text-sm font-['Crimson_Text'] italic">
                    <User className="w-4 h-4 inline mr-2" />
                    Only administrators can edit or delete events.
                  </p>
                </div>
              )}

              {/* Comments Section */}
              {event.id && (
                <div className="border-t-2 border-amber-700/30 pt-8">
                  <div className="flex items-center space-x-3 mb-6">
                    <MessageCircle className="w-6 h-6 text-amber-400" />
                    <h4 className="text-xl font-bold text-amber-100 font-['Playfair_Display']">
                      Comments ({localComments.length})
                    </h4>
                  </div>

                  {currentUser && (
                    <div className="mb-8">
                      <div className="flex space-x-4">
                        <div className="flex-1">
                          <textarea
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder="Add a comment..."
                            rows={3}
                            className="w-full bg-stone-800/60 border-2 border-stone-700/50 rounded-lg px-4 py-3 text-amber-100 placeholder-amber-300/60 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30 font-['Crimson_Text'] backdrop-blur-sm academic-shadow resize-none"
                          />
                        </div>
                        <button
                          onClick={handleAddComment}
                          disabled={!newComment.trim()}
                          className="px-6 py-3 bg-gradient-to-r from-amber-700/80 to-amber-800/80 text-amber-100 rounded-lg hover:from-amber-600/90 hover:to-amber-700/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 font-['Source_Serif_Pro'] font-semibold academic-shadow backdrop-blur-sm border border-amber-600/50 self-start"
                        >
                          Post
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="space-y-4">
                    {localComments && localComments.length > 0 ? (
                      localComments.map((comment) => (
                        <div key={comment.id} className="bg-gradient-to-br from-stone-800/40 to-amber-900/20 rounded-lg p-5 border border-amber-700/20 backdrop-blur-sm academic-shadow">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center space-x-3">
                              <User className="w-5 h-5 text-amber-400" />
                              <span className="font-bold text-amber-100 font-['Source_Serif_Pro']">
                                {comment.author}
                              </span>
                              <span className="text-sm text-amber-300/70 font-['Crimson_Text'] italic">
                                {new Date(comment.created_at || comment.timestamp).toLocaleDateString()}
                              </span>
                            </div>
                            {currentUser && (currentUser.name === comment.author || currentUser.username === comment.author || isAdmin) && (
                              <button
                                onClick={() => setCommentToDelete(comment.id)}
                                className="text-amber-400/60 hover:text-red-400 transition-colors p-1 hover:bg-red-900/20 rounded"
                                title={isAdmin ? "Delete comment (Admin)" : "Delete your comment"}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                          <div className="text-left">
                            <p className="text-amber-200/90 font-['Crimson_Text'] leading-relaxed">
                              {comment.text}
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-amber-300/60 text-center py-8 font-['Crimson_Text'] italic">
                        No comments yet. Be the first to share your thoughts!
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Delete Event Confirmation - Only shown for admins */}
      {showDeleteConfirm && isAdmin && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center p-4 z-60 backdrop-blur-sm">
          <div className="bg-gradient-to-br from-stone-900/95 to-amber-900/20 border-2 border-amber-700/50 rounded-xl shadow-2xl max-w-md w-full p-6 academic-shadow backdrop-blur-md">
            <h3 className="text-xl font-bold text-amber-100 mb-4 font-['Playfair_Display']">
              Delete Event (Admin Action)
            </h3>
            <p className="text-amber-200/80 mb-6 font-['Crimson_Text']">
              Are you sure you want to delete "<span className="font-semibold text-amber-100">{event.title}</span>"? This action cannot be undone and will remove all associated comments.
            </p>
            <div className="bg-red-900/20 border border-red-700/30 rounded-lg p-3 mb-6">
              <p className="text-red-200 text-sm font-['Crimson_Text']">
                <User className="w-4 h-4 inline mr-2" />
                This action is restricted to administrators only.
              </p>
            </div>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-6 py-3 text-amber-200 hover:text-amber-100 transition-all duration-300 font-['Source_Serif_Pro'] font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-6 py-3 bg-gradient-to-r from-red-700/80 to-red-800/80 text-red-100 rounded-lg hover:from-red-600/90 hover:to-red-700/90 transition-all duration-300 font-['Source_Serif_Pro'] font-semibold academic-shadow backdrop-blur-sm border border-red-600/50"
              >
                Delete Event
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Comment Confirmation */}
      {commentToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center p-4 z-60 backdrop-blur-sm">
          <div className="bg-gradient-to-br from-stone-900/95 to-amber-900/20 border-2 border-amber-700/50 rounded-xl shadow-2xl max-w-md w-full p-6 academic-shadow backdrop-blur-md">
            <h3 className="text-xl font-bold text-amber-100 mb-4 font-['Playfair_Display']">
              Delete Comment
            </h3>
            <p className="text-amber-200/80 mb-6 font-['Crimson_Text']">
              Are you sure you want to delete this comment? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setCommentToDelete(null)}
                className="px-6 py-3 text-amber-200 hover:text-amber-100 transition-all duration-300 font-['Source_Serif_Pro'] font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteComment(commentToDelete)}
                className="px-6 py-3 bg-gradient-to-r from-red-700/80 to-red-800/80 text-red-100 rounded-lg hover:from-red-600/90 hover:to-red-700/90 transition-all duration-300 font-['Source_Serif_Pro'] font-semibold academic-shadow backdrop-blur-sm border border-red-600/50"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .academic-shadow {
          box-shadow: 
            0 4px 6px -1px rgba(0, 0, 0, 0.3),
            0 2px 4px -1px rgba(0, 0, 0, 0.2),
            inset 0 1px 0 rgba(255, 255, 255, 0.1);
        }
      `}</style>
    </div>
  );
};
