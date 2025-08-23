import React, { useState, useEffect } from 'react';
import { X, MapPin, Clock, Calendar, Loader2 } from 'lucide-react';
import { User } from '../types/User';

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: Date | null;
  onCreateEvent: (eventData: {
    title: string;
    description: string;
    date: Date;
    time: string;
    venue?: string;
  }) => Promise<void>;
  user: User;
}

export const EventModal: React.FC<EventModalProps> = ({
  isOpen,
  onClose,
  selectedDate,
  onCreateEvent,
  user
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('09:00');
  const [venue, setVenue] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && selectedDate) {
      setDate(selectedDate.toISOString().split('T')[0]);
    }
  }, [isOpen, selectedDate]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setTime('09:00');
    setVenue('');
    setError('');
    setLoading(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !date) {
      setError('Title and date are required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await onCreateEvent({
        title: title.trim(),
        description: description.trim(),
        date: new Date(date),
        time,
        venue: venue.trim() || undefined
      });
      
      handleClose();
    } catch (error: any) {
      console.error('EventModal: Error creating event:', error);
      setError(error.message || 'Failed to create event');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div 
        className="bg-gradient-to-br from-stone-900/95 to-amber-900/20 border-2 border-amber-700/50 rounded-xl shadow-2xl max-w-2xl w-full backdrop-blur-md"
        style={{ 
          maxHeight: '90vh',
          height: 'auto',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Fixed Header */}
        <div className="bg-gradient-to-r from-stone-900/95 via-amber-900/30 to-stone-800/95 text-amber-100 p-6 rounded-t-xl border-b-2 border-amber-700/40 flex-shrink-0">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold font-['Playfair_Display'] drop-shadow-lg">
              Create New Event
            </h2>
            <button
              onClick={handleClose}
              disabled={loading}
              className="p-3 hover:bg-stone-700/40 rounded-lg transition-all duration-300 backdrop-blur-sm border border-stone-600/30 disabled:opacity-50"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className="text-amber-300/80 mt-2 font-['Crimson_Text']">
            Administrator: {user.username}
          </p>
        </div>

        {/* Scrollable Content */}
        <div 
          className="p-8 space-y-8"
          style={{
            flex: '1 1 auto',
            overflowY: 'auto',
            minHeight: '0'
          }}
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-amber-200 text-sm font-bold mb-3 font-['Source_Serif_Pro']">
                Event Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-stone-800/60 border-2 border-stone-700/50 rounded-lg px-4 py-3 text-amber-100 placeholder-amber-300/60 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30 font-['Crimson_Text'] backdrop-blur-sm"
                placeholder="Enter event title..."
                required
                autoFocus
                disabled={loading}
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
                className="w-full bg-stone-800/60 border-2 border-stone-700/50 rounded-lg px-4 py-3 text-amber-100 placeholder-amber-300/60 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30 font-['Crimson_Text'] backdrop-blur-sm resize-none"
                placeholder="Enter event description..."
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-amber-200 text-sm font-bold mb-3 font-['Source_Serif_Pro']">
                <Calendar size={16} className="inline mr-2" />
                Event Date *
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-stone-800/60 border-2 border-stone-700/50 rounded-lg px-4 py-3 text-amber-100 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30 font-['Crimson_Text'] backdrop-blur-sm"
                required
                disabled={loading}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-amber-200 text-sm font-bold mb-3 font-['Source_Serif_Pro']">
                  <Clock size={16} className="inline mr-2" />
                  Time
                </label>
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full bg-stone-800/60 border-2 border-stone-700/50 rounded-lg px-4 py-3 text-amber-100 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30 font-['Crimson_Text'] backdrop-blur-sm"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-amber-200 text-sm font-bold mb-3 font-['Source_Serif_Pro']">
                  <MapPin size={16} className="inline mr-2" />
                  Venue (Optional)
                </label>
                <input
                  type="text"
                  value={venue}
                  onChange={(e) => setVenue(e.target.value)}
                  className="w-full bg-stone-800/60 border-2 border-stone-700/50 rounded-lg px-4 py-3 text-amber-100 placeholder-amber-300/60 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30 font-['Crimson_Text'] backdrop-blur-sm"
                  placeholder="Event location..."
                  disabled={loading}
                />
              </div>
            </div>

            {error && (
              <div className="bg-gradient-to-r from-red-900/30 to-red-800/20 border border-red-700/50 rounded-lg p-4">
                <p className="text-red-200 text-sm font-['Crimson_Text']">{error}</p>
              </div>
            )}

            <div className="flex justify-end space-x-4 pt-6 border-t-2 border-amber-700/30">
              <button
                type="button"
                onClick={handleClose}
                disabled={loading}
                className="px-6 py-3 text-amber-200 hover:text-amber-100 transition-all duration-300 font-['Source_Serif_Pro'] font-semibold disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!title.trim() || !date || loading}
                className="px-6 py-3 bg-gradient-to-r from-amber-700/80 to-amber-800/80 text-amber-100 rounded-lg hover:from-amber-600/90 hover:to-amber-700/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 font-['Source_Serif_Pro'] font-semibold backdrop-blur-sm border border-amber-600/50 flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Event'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
