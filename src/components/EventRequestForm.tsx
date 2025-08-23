import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, MapPin, Clock, Send } from 'lucide-react';
import { eventRequestService } from '../services/supabaseService';
import { User } from '../types/User';

interface EventRequestFormProps {
  onClose: () => void;
  onSubmit: (eventData: any) => void;
  currentUser: User;
}

export const EventRequestForm: React.FC<EventRequestFormProps> = ({
  onClose,
  onSubmit,
  currentUser
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [time, setTime] = useState('09:00');
  const [venue, setVenue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !selectedDate) {
      setError('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    setError('');
    
    try {
      console.log('EventRequestForm: Submitting request with data:', {
        title: title.trim(),
        description: description.trim(),
        date: selectedDate,
        time,
        venue: venue.trim(),
        requested_by: currentUser.id
      });

      const eventData = {
        title: title.trim(),
        description: description.trim(),
        date: selectedDate,
        time,
        venue: venue.trim(),
        requested_by: currentUser.id
      };

      const createdRequest = await eventRequestService.createEventRequest(eventData);
      
      console.log('EventRequestForm: Request created successfully:', createdRequest);
      
      // Call the onSubmit callback to notify parent component
      onSubmit(createdRequest);
      
      // Close the form
      handleClose();
      
    } catch (error) {
      console.error('EventRequestForm: Error submitting event request:', error);
      setError('Failed to submit event request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setTitle('');
    setDescription('');
    setSelectedDate('');
    setTime('09:00');
    setVenue('');
    setError('');
    onClose();
  };

  const modalContent = (
    <div 
      className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm"
      style={{ 
        zIndex: 999999,
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleClose();
        }
      }}
    >
      <div 
        className="bg-gradient-to-br from-stone-800/95 to-amber-900/80 border-2 border-amber-700/50 rounded-lg max-w-2xl w-full academic-shadow backdrop-blur-md relative max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
        style={{ zIndex: 1000000 }}
      >
        <div className="p-6 border-b border-amber-700/30 bg-gradient-to-r from-stone-700/60 to-amber-800/40 backdrop-blur-sm sticky top-0">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-amber-100 font-['Playfair_Display'] drop-shadow-lg">
              Request New Event
            </h2>
            <button
              onClick={handleClose}
              className="text-amber-200 hover:text-amber-100 transition-colors p-2 hover:bg-amber-700/30 rounded-md"
              type="button"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-900/30 border border-red-700/50 rounded-lg text-red-200">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-amber-200 text-sm font-semibold mb-2 font-['Source_Serif_Pro']">
                Event Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-stone-700/60 border-2 border-stone-600/50 rounded-md px-4 py-3 text-amber-100 placeholder-amber-300/60 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30 font-['Crimson_Text'] backdrop-blur-sm"
                placeholder="Enter event title..."
                required
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label className="block text-amber-200 text-sm font-semibold mb-2 font-['Source_Serif_Pro']">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full bg-stone-700/60 border-2 border-stone-600/50 rounded-md px-4 py-3 text-amber-100 placeholder-amber-300/60 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30 resize-none font-['Crimson_Text'] backdrop-blur-sm"
                placeholder="Event description..."
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label className="block text-amber-200 text-sm font-semibold mb-2 font-['Source_Serif_Pro']">
                Event Date *
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full bg-stone-700/60 border-2 border-stone-600/50 rounded-md px-4 py-3 text-amber-100 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30 font-['Crimson_Text'] backdrop-blur-sm"
                required
                disabled={isSubmitting}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-amber-200 text-sm font-semibold mb-2 font-['Source_Serif_Pro']">
                  <Clock size={16} className="inline mr-2" />
                  Time
                </label>
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full bg-stone-700/60 border-2 border-stone-600/50 rounded-md px-4 py-3 text-amber-100 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30 font-['Crimson_Text'] backdrop-blur-sm"
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label className="block text-amber-200 text-sm font-semibold mb-2 font-['Source_Serif_Pro']">
                  <MapPin size={16} className="inline mr-2" />
                  Venue (Optional)
                </label>
                <input
                  type="text"
                  value={venue}
                  onChange={(e) => setVenue(e.target.value)}
                  className="w-full bg-stone-700/60 border-2 border-stone-600/50 rounded-md px-4 py-3 text-amber-100 placeholder-amber-300/60 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30 font-['Crimson_Text'] backdrop-blur-sm"
                  placeholder="Event location..."
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className="bg-amber-900/30 border border-amber-700/40 rounded-md p-4 backdrop-blur-sm">
              <p className="text-amber-200 text-sm font-['Crimson_Text']">
                <strong>Note:</strong> Your event request will be sent to administrators for review. 
                You will be notified once it's approved or if any changes are needed.
              </p>
            </div>

            <div className="flex gap-4">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 bg-gradient-to-r from-stone-600/80 to-stone-700/80 text-amber-100 font-semibold py-3 px-6 rounded-md hover:from-stone-500/90 hover:to-stone-600/90 transition-all duration-300 academic-shadow font-['Source_Serif_Pro'] backdrop-blur-sm"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 bg-gradient-to-r from-amber-700/80 to-stone-700/80 text-amber-100 font-semibold py-3 px-6 rounded-md hover:from-amber-600/90 hover:to-stone-600/90 transition-all duration-300 academic-shadow font-['Source_Serif_Pro'] backdrop-blur-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-amber-100"></div>
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send size={20} />
                    Submit Request
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        <style jsx>{`
          .academic-shadow {
            box-shadow: 
              0 4px 6px -1px rgba(0, 0, 0, 0.3),
              0 2px 4px -1px rgba(0, 0, 0, 0.2),
              inset 0 1px 0 rgba(255, 255, 255, 0.1);
          }
        `}</style>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
