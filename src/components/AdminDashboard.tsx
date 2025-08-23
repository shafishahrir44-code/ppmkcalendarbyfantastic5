import React, { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, User, CheckCircle, XCircle, Trash2, AlertTriangle } from 'lucide-react';
import { EventRequest } from '../types/EventRequest';
import { CalendarEvent } from '../types/Event';
import { User as UserType } from '../types/User';
import { eventRequestService, eventService } from '../services/supabaseService';

interface AdminDashboardProps {
  currentUser: UserType;
  onEventCreated?: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ currentUser, onEventCreated }) => {
  const [eventRequests, setEventRequests] = useState<EventRequest[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [processingRequestId, setProcessingRequestId] = useState<string | null>(null);
  const [deletingEventId, setDeletingEventId] = useState<string | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const [requestsData, eventsData] = await Promise.all([
        eventRequestService.getAllEventRequests(),
        eventService.getAllEvents()
      ]);
      
      setEventRequests(requestsData);
      setEvents(eventsData);
    } catch (error: any) {
      setError('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestAction = async (requestId: string, action: 'approved' | 'denied', adminNotes?: string) => {
    try {
      setProcessingRequestId(requestId);
      setError('');

      await eventRequestService.updateEventRequest(requestId, {
        status: action,
        admin_notes: adminNotes || '',
        reviewed_by: currentUser.id,
        reviewed_at: new Date().toISOString()
      });

      await loadData();
      
      if (onEventCreated && action === 'approved') {
        onEventCreated();
      }
    } catch (error: any) {
      setError(error.message || `Failed to ${action} request`);
    } finally {
      setProcessingRequestId(null);
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    try {
      setDeletingEventId(eventId);
      setError('');

      await eventService.deleteEvent(eventId);
      
      // Remove the event from local state
      setEvents(prev => prev.filter(event => event.id !== eventId));
      
      // Refresh data to ensure consistency
      await loadData();
      
      if (onEventCreated) {
        onEventCreated();
      }
      
      setDeleteConfirmation(null);
    } catch (error: any) {
      setError(error.message || 'Failed to delete event');
    } finally {
      setDeletingEventId(null);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (time: string) => {
    try {
      const [hours, minutes] = time.split(':');
      const hour = parseInt(hours);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour % 12 || 12;
      return `${displayHour}:${minutes} ${ampm}`;
    } catch {
      return time;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500 mx-auto"></div>
          <p className="text-amber-200 font-['Crimson_Text']">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  const pendingRequests = eventRequests.filter(req => req.status === 'pending');
  const recentRequests = eventRequests.filter(req => req.status !== 'pending').slice(0, 5);
  const upcomingEvents = events
    .filter(event => event.date >= new Date())
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(0, 10);

  return (
    <div className="space-y-8">
      {error && (
        <div className="p-4 bg-red-900/30 border border-red-700/50 rounded-lg text-red-200">
          {error}
        </div>
      )}

      {/* Pending Requests Section */}
      <div>
        <h3 className="text-xl font-bold text-amber-100 mb-4 font-['Playfair_Display']">
          Pending Event Requests ({pendingRequests.length})
        </h3>
        
        {pendingRequests.length === 0 ? (
          <div className="bg-gradient-to-r from-stone-800/40 to-amber-900/20 rounded-lg p-6 border border-amber-700/30">
            <p className="text-amber-300/80 text-center font-['Crimson_Text'] italic">
              No pending requests at this time
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingRequests.map((request) => (
              <div key={request.id} className="bg-gradient-to-r from-stone-800/60 to-amber-900/20 rounded-lg p-6 border border-amber-700/30 backdrop-blur-sm">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-amber-100 font-['Source_Serif_Pro']">
                      {request.title}
                    </h4>
                    <p className="text-amber-300/80 text-sm font-['Crimson_Text'] mt-1">
                      Requested by {request.requesterName}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleRequestAction(request.id, 'approved')}
                      disabled={processingRequestId === request.id}
                      className="flex items-center gap-2 bg-green-700/80 hover:bg-green-600/90 text-green-100 px-4 py-2 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed font-['Source_Serif_Pro'] font-semibold"
                    >
                      <CheckCircle size={16} />
                      {processingRequestId === request.id ? 'Processing...' : 'Approve'}
                    </button>
                    <button
                      onClick={() => handleRequestAction(request.id, 'denied')}
                      disabled={processingRequestId === request.id}
                      className="flex items-center gap-2 bg-red-700/80 hover:bg-red-600/90 text-red-100 px-4 py-2 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed font-['Source_Serif_Pro'] font-semibold"
                    >
                      <XCircle size={16} />
                      {processingRequestId === request.id ? 'Processing...' : 'Deny'}
                    </button>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="flex items-center gap-2 text-amber-200">
                    <Calendar size={16} />
                    <span className="font-['Crimson_Text']">{formatDate(request.date)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-amber-200">
                    <Clock size={16} />
                    <span className="font-['Crimson_Text']">{formatTime(request.time)}</span>
                  </div>
                  {request.venue && (
                    <div className="flex items-center gap-2 text-amber-200">
                      <MapPin size={16} />
                      <span className="font-['Crimson_Text']">{request.venue}</span>
                    </div>
                  )}
                </div>
                
                {request.description && (
                  <div className="mt-4 p-3 bg-stone-900/30 rounded-lg border border-stone-700/30">
                    <p className="text-amber-200/90 text-sm font-['Crimson_Text']">
                      {request.description}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upcoming Events Management Section */}
      <div>
        <h3 className="text-xl font-bold text-amber-100 mb-4 font-['Playfair_Display']">
          Upcoming Events Management ({upcomingEvents.length})
        </h3>
        
        {upcomingEvents.length === 0 ? (
          <div className="bg-gradient-to-r from-stone-800/40 to-amber-900/20 rounded-lg p-6 border border-amber-700/30">
            <p className="text-amber-300/80 text-center font-['Crimson_Text'] italic">
              No upcoming events scheduled
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {upcomingEvents.map((event) => (
              <div key={event.id} className="bg-gradient-to-r from-stone-800/60 to-amber-900/20 rounded-lg p-6 border border-amber-700/30 backdrop-blur-sm">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-amber-100 font-['Source_Serif_Pro']">
                      {event.title}
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mt-3">
                      <div className="flex items-center gap-2 text-amber-200">
                        <Calendar size={16} />
                        <span className="font-['Crimson_Text']">{formatDate(event.date)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-amber-200">
                        <Clock size={16} />
                        <span className="font-['Crimson_Text']">{formatTime(event.time)}</span>
                      </div>
                      {event.venue && (
                        <div className="flex items-center gap-2 text-amber-200">
                          <MapPin size={16} />
                          <span className="font-['Crimson_Text']">{event.venue}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => setDeleteConfirmation(event.id)}
                      disabled={deletingEventId === event.id}
                      className="flex items-center gap-2 bg-red-700/80 hover:bg-red-600/90 text-red-100 px-4 py-2 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed font-['Source_Serif_Pro'] font-semibold"
                    >
                      <Trash2 size={16} />
                      {deletingEventId === event.id ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </div>
                
                {event.description && (
                  <div className="mt-4 p-3 bg-stone-900/30 rounded-lg border border-stone-700/30">
                    <p className="text-amber-200/90 text-sm font-['Crimson_Text']">
                      {event.description}
                    </p>
                  </div>
                )}

                {event.comments && event.comments.length > 0 && (
                  <div className="mt-4 p-3 bg-amber-900/20 rounded-lg border border-amber-600/30">
                    <p className="text-amber-200 text-sm font-semibold mb-2 font-['Source_Serif_Pro']">
                      Comments ({event.comments.length})
                    </p>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {event.comments.slice(0, 3).map((comment) => (
                        <div key={comment.id} className="text-xs text-amber-200/80 font-['Crimson_Text']">
                          <span className="font-semibold">{comment.author}:</span> {comment.text}
                        </div>
                      ))}
                      {event.comments.length > 3 && (
                        <p className="text-xs text-amber-300/60 font-['Crimson_Text'] italic">
                          +{event.comments.length - 3} more comments
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Requests Section */}
      {recentRequests.length > 0 && (
        <div>
          <h3 className="text-xl font-bold text-amber-100 mb-4 font-['Playfair_Display']">
            Recent Decisions
          </h3>
          
          <div className="space-y-3">
            {recentRequests.map((request) => (
              <div key={request.id} className="bg-gradient-to-r from-stone-800/40 to-amber-900/10 rounded-lg p-4 border border-stone-700/30">
                <div className="flex justify-between items-center">
                  <div className="flex-1">
                    <h4 className="text-amber-100 font-semibold font-['Source_Serif_Pro']">
                      {request.title}
                    </h4>
                    <p className="text-amber-300/70 text-sm font-['Crimson_Text']">
                      by {request.requesterName} • {formatDate(request.date)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold font-['Source_Serif_Pro'] ${
                      request.status === 'approved' 
                        ? 'bg-green-700/30 text-green-200 border border-green-600/30' 
                        : 'bg-red-700/30 text-red-200 border border-red-600/30'
                    }`}>
                      {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                    </span>
                    {request.reviewerName && (
                      <span className="text-amber-300/60 text-xs font-['Crimson_Text']">
                        by {request.reviewerName}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmation && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-gradient-to-br from-stone-900/95 to-red-900/20 backdrop-blur-md rounded-xl shadow-2xl border-2 border-red-700/50 max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-8 h-8 text-red-400" />
              <h3 className="text-xl font-bold text-red-200 font-['Playfair_Display']">
                Delete Event
              </h3>
            </div>
            
            <div className="mb-6">
              <p className="text-amber-200 font-['Crimson_Text'] mb-2">
                Are you sure you want to delete this event? This action cannot be undone.
              </p>
              <div className="bg-stone-900/50 rounded-lg p-3 border border-stone-700/50">
                <p className="text-amber-100 font-semibold font-['Source_Serif_Pro']">
                  {events.find(e => e.id === deleteConfirmation)?.title}
                </p>
                <p className="text-amber-300/80 text-sm font-['Crimson_Text']">
                  {events.find(e => e.id === deleteConfirmation) && 
                    formatDate(events.find(e => e.id === deleteConfirmation)!.date)
                  }
                </p>
              </div>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirmation(null)}
                className="flex-1 bg-stone-700/80 hover:bg-stone-600/90 text-amber-100 px-4 py-2 rounded-lg transition-all duration-300 font-['Source_Serif_Pro'] font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteEvent(deleteConfirmation)}
                disabled={deletingEventId === deleteConfirmation}
                className="flex-1 bg-red-700/80 hover:bg-red-600/90 text-red-100 px-4 py-2 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed font-['Source_Serif_Pro'] font-semibold"
              >
                {deletingEventId === deleteConfirmation ? 'Deleting...' : 'Delete Event'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
