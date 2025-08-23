import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus, Settings, LogOut, Send, MessageSquare, ChevronDown } from 'lucide-react';
import { EventModal } from './EventModal';
import { EventRequestModal } from './EventRequestModal';
import { EventPopup } from './EventPopup';
import { AdminPanel } from './AdminPanel';
import { YearView } from './YearView';
import { CalendarEvent } from '../types/Event';
import { EventRequest } from '../types/EventRequest';
import { User } from '../types/User';
import { eventService, eventRequestService, commentService } from '../services/supabaseService';

interface CalendarProps {
  user: User;
  onLogout: () => void;
}

export const Calendar: React.FC<CalendarProps> = ({ user, onLogout }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [eventRequests, setEventRequests] = useState<EventRequest[]>([]);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [isEventPopupOpen, setIsEventPopupOpen] = useState(false);
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  const [isYearViewOpen, setIsYearViewOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      loadData(true);
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const loadData = async (silent = false) => {
    try {
      if (!silent) {
        setLoading(true);
      }
      setError('');
      
      const [eventsData, requestsData] = await Promise.all([
        eventService.getAllEvents(),
        eventRequestService.getAllEventRequests()
      ]);
      
      setEvents(eventsData);
      setEventRequests(requestsData);
    } catch (error: any) {
      setError('Failed to load calendar data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEvent = async (eventData: {
    title: string;
    description: string;
    date: Date;
    time: string;
    venue?: string;
  }) => {
    try {
      const newEvent = await eventService.createEvent({
        title: eventData.title,
        description: eventData.description,
        date: eventData.date.toISOString().split('T')[0],
        time: eventData.time,
        venue: eventData.venue || '',
        created_by: user.id
      });
      
      setEvents(prev => [...prev, newEvent]);
      setSelectedDate(null);
      
      await loadData();
    } catch (error: any) {
      throw new Error(error.message || 'Failed to create event');
    }
  };

  const handleSubmitRequest = async (requestData: {
    title: string;
    description: string;
    date: Date;
    time: string;
    venue?: string;
  }) => {
    try {
      const newRequest = await eventRequestService.createEventRequest({
        title: requestData.title,
        description: requestData.description,
        date: requestData.date.toISOString().split('T')[0],
        time: requestData.time,
        venue: requestData.venue || '',
        requested_by: user.id
      });
      
      setEventRequests(prev => [...prev, newRequest]);
    } catch (error: any) {
      throw new Error(error.message || 'Failed to submit event request');
    }
  };

  const handleEventClick = (event: CalendarEvent, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedEvent(event);
    setIsEventPopupOpen(true);
  };

  const handleEventSave = async (eventData: Omit<CalendarEvent, 'id' | 'comments'>) => {
    if (!selectedEvent) return;

    try {
      const updatedEvent = await eventService.updateEvent(selectedEvent.id, {
        title: eventData.title,
        description: eventData.description,
        date: eventData.date.toISOString().split('T')[0],
        time: eventData.time,
        venue: eventData.venue
      });

      setEvents(prev => prev.map(event => 
        event.id === selectedEvent.id ? updatedEvent : event
      ));

      await loadData();
    } catch (error: any) {
      throw new Error(error.message || 'Failed to update event');
    }
  };

  const handleEventDelete = async (eventId: string) => {
    try {
      await eventService.deleteEvent(eventId);
      setEvents(prev => prev.filter(event => event.id !== eventId));
      setIsEventPopupOpen(false);
      setSelectedEvent(null);
      await loadData();
    } catch (error: any) {
      throw new Error(error.message || 'Failed to delete event');
    }
  };

  const handleAddComment = async (eventId: string, comment: string, author: string) => {
    try {
      const newComment = await commentService.createComment({
        event_id: eventId,
        text: comment,
        author: author
      });

      // Update the selected event with the new comment
      if (selectedEvent && selectedEvent.id === eventId) {
        const updatedEvent = {
          ...selectedEvent,
          comments: [...(selectedEvent.comments || []), newComment]
        };
        setSelectedEvent(updatedEvent);
      }

      // Update the events list
      setEvents(prev => prev.map(event => 
        event.id === eventId 
          ? { ...event, comments: [...(event.comments || []), newComment] }
          : event
      ));

      await loadData();
    } catch (error: any) {
      throw new Error(error.message || 'Failed to add comment');
    }
  };

  const handleDeleteComment = async (eventId: string, commentId: string) => {
    try {
      await commentService.deleteComment(commentId);

      // Update the selected event by removing the comment
      if (selectedEvent && selectedEvent.id === eventId) {
        const updatedEvent = {
          ...selectedEvent,
          comments: (selectedEvent.comments || []).filter(comment => comment.id !== commentId)
        };
        setSelectedEvent(updatedEvent);
      }

      // Update the events list
      setEvents(prev => prev.map(event => 
        event.id === eventId 
          ? { ...event, comments: (event.comments || []).filter(comment => comment.id !== commentId) }
          : event
      ));

      await loadData();
    } catch (error: any) {
      throw new Error(error.message || 'Failed to delete comment');
    }
  };

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const getEventsForDate = (date: Date) => {
    const dateString = date.toISOString().split('T')[0];
    
    const dayEvents = events.filter(event => {
      const eventDateString = event.date.toISOString().split('T')[0];
      return eventDateString === dateString;
    });
    
    return dayEvents;
  };

  const getEventsForMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    
    return events.filter(event => {
      const eventDate = new Date(event.date);
      return eventDate.getFullYear() === year && eventDate.getMonth() === month;
    });
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const handleMonthSelect = (month: number, year?: number) => {
    const targetYear = year || currentDate.getFullYear();
    setCurrentDate(new Date(targetYear, month, 1));
    setIsYearViewOpen(false);
  };

  const handleDateClick = (day: number) => {
    const clickedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    setSelectedDate(clickedDate);
    
    if (user.role === 'admin') {
      setIsEventModalOpen(true);
    }
  };

  const handleAdminPanelClose = async () => {
    setIsAdminPanelOpen(false);
    await loadData();
  };

  const renderCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const days = [];

    for (let i = 0; i < firstDay; i++) {
      days.push(
        <div key={`empty-${i}`} className="h-24 border border-stone-700/30"></div>
      );
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      const dayEvents = getEventsForDate(date);
      const isToday = new Date().toDateString() === date.toDateString();
      const isSelected = selectedDate?.toDateString() === date.toDateString();

      days.push(
        <div
          key={day}
          onClick={() => handleDateClick(day)}
          className={`h-24 border border-stone-700/30 p-2 cursor-pointer transition-all duration-300 hover:bg-stone-700/20 ${
            isToday ? 'bg-amber-900/30 border-amber-600/50' : ''
          } ${isSelected ? 'bg-amber-800/40 border-amber-500' : ''}`}
        >
          <div className={`text-sm font-semibold mb-1 ${
            isToday ? 'text-amber-200' : 'text-amber-100'
          }`}>
            {day}
          </div>
          <div className="space-y-1">
            {dayEvents.slice(0, 2).map((event, index) => (
              <div
                key={event.id}
                onClick={(e) => handleEventClick(event, e)}
                className="text-xs bg-amber-700/60 text-amber-100 px-2 py-1 rounded truncate backdrop-blur-sm hover:bg-amber-600/70 transition-all duration-200 cursor-pointer flex items-center gap-1 group"
                title={`${event.title} - ${event.time} ${event.comments && event.comments.length > 0 ? `(${event.comments.length} comments)` : ''}`}
              >
                <span className="flex-1 truncate">{event.title}</span>
                {event.comments && event.comments.length > 0 && (
                  <MessageSquare size={10} className="text-amber-200 opacity-70 group-hover:opacity-100" />
                )}
              </div>
            ))}
            {dayEvents.length > 2 && (
              <div 
                className="text-xs text-amber-300/80 cursor-pointer hover:text-amber-200 transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  if (dayEvents.length > 2) {
                    handleEventClick(dayEvents[2], e);
                  }
                }}
              >
                +{dayEvents.length - 2} more
              </div>
            )}
          </div>
        </div>
      );
    }

    return days;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-stone-900 via-amber-900/20 to-stone-800 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto"></div>
          <p className="text-amber-200 font-['Crimson_Text']">Loading calendar...</p>
        </div>
      </div>
    );
  }

  const currentMonthEvents = getEventsForMonth(currentDate);
  const eventCount = currentMonthEvents.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-900 via-amber-900/20 to-stone-800">
      {/* Header */}
      <div className="bg-gradient-to-r from-stone-900/95 via-amber-900/30 to-stone-800/95 text-amber-100 p-6 backdrop-blur-md border-b-2 border-amber-700/40">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-6">
            {/* PPMK Logo */}
            <div className="flex-shrink-0">
              <img 
                src="https://cdn.chatandbuild.com/users/688cacb89963427649f657c2/gambar-ppmk-1755929666927-797825132.jpg" 
                alt="PPMK Logo" 
                className="w-16 h-16 rounded-full object-cover border-2 border-amber-600/50 shadow-lg academic-shadow"
              />
            </div>
            
            {/* Title and User Info */}
            <div>
              <h1 className="text-3xl font-bold font-['Playfair_Display'] drop-shadow-lg">
                PPMK Calendar
              </h1>
              <p className="text-amber-300/80 mt-1 font-['Crimson_Text']">
                Welcome, {user.username} ({user.role})
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsRequestModalOpen(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-amber-700/80 to-stone-700/80 text-amber-100 px-4 py-2 rounded-lg hover:from-amber-600/90 hover:to-stone-600/90 transition-all duration-300 font-['Source_Serif_Pro'] font-semibold backdrop-blur-sm border border-amber-600/50"
            >
              <Send size={18} />
              Request Event
            </button>

            {user.role === 'admin' && (
              <button
                onClick={() => setIsAdminPanelOpen(true)}
                className="flex items-center gap-2 bg-gradient-to-r from-stone-700/80 to-amber-700/80 text-amber-100 px-4 py-2 rounded-lg hover:from-stone-600/90 hover:to-amber-600/90 transition-all duration-300 font-['Source_Serif_Pro'] font-semibold backdrop-blur-sm border border-stone-600/50"
              >
                <Settings size={18} />
                Admin Panel
              </button>
            )}

            <button
              onClick={onLogout}
              className="flex items-center gap-2 bg-gradient-to-r from-red-800/80 to-stone-700/80 text-amber-100 px-4 py-2 rounded-lg hover:from-red-700/90 hover:to-stone-600/90 transition-all duration-300 font-['Source_Serif_Pro'] font-semibold backdrop-blur-sm border border-red-600/50"
            >
              <LogOut size={18} />
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Calendar */}
      <div className="max-w-7xl mx-auto p-6">
        {error && (
          <div className="mb-6 p-4 bg-red-900/30 border border-red-700/50 rounded-lg text-red-200">
            {error}
          </div>
        )}

        {/* Calendar Header */}
        <div className="bg-gradient-to-r from-stone-800/60 to-amber-900/40 rounded-t-xl p-6 border-2 border-amber-700/50 backdrop-blur-md">
          <div className="flex justify-between items-center">
            {/* Left Navigation */}
            <button
              onClick={() => navigateMonth('prev')}
              className="p-3 hover:bg-stone-700/40 rounded-lg transition-all duration-300 backdrop-blur-sm border border-stone-600/30"
            >
              <ChevronLeft className="w-6 h-6 text-amber-200" />
            </button>
            
            {/* Center - Month Title and Year View Button */}
            <div className="flex flex-col items-center">
              <button
                onClick={() => setIsYearViewOpen(true)}
                className="flex items-center gap-3 hover:bg-stone-700/30 px-6 py-3 rounded-xl transition-all duration-300 transform hover:scale-105"
              >
                <h2 className="text-2xl font-bold text-amber-100 font-['Playfair_Display'] drop-shadow-lg">
                  {months[currentDate.getMonth()]} {currentDate.getFullYear()}
                </h2>
                <ChevronDown className="w-6 h-6 text-amber-200 transition-transform duration-200" />
              </button>
              
              {/* Event Count - positioned below title */}
              <div className="mt-3 bg-gradient-to-r from-amber-800/50 to-stone-700/50 px-4 py-2 rounded-lg border border-amber-600/40 backdrop-blur-sm">
                <span className="text-amber-200 font-['Source_Serif_Pro'] font-medium text-sm">
                  {eventCount} {eventCount === 1 ? 'event' : 'events'} this month
                </span>
              </div>
            </div>
            
            {/* Right Navigation */}
            <button
              onClick={() => navigateMonth('next')}
              className="p-3 hover:bg-stone-700/40 rounded-lg transition-all duration-300 backdrop-blur-sm border border-stone-600/30"
            >
              <ChevronRight className="w-6 h-6 text-amber-200" />
            </button>
          </div>
        </div>

        {/* Days of Week Header */}
        <div className="grid grid-cols-7 bg-gradient-to-r from-amber-900/40 to-stone-800/60 border-x-2 border-amber-700/50 backdrop-blur-md">
          {daysOfWeek.map(day => (
            <div key={day} className="p-4 text-center font-semibold text-amber-200 border-r border-stone-700/30 last:border-r-0 font-['Source_Serif_Pro']">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 bg-gradient-to-br from-stone-800/40 to-amber-900/20 border-2 border-t-0 border-amber-700/50 rounded-b-xl backdrop-blur-md">
          {renderCalendarDays()}
        </div>

        {/* Instructions */}
        <div className="mt-6 p-4 bg-gradient-to-r from-amber-900/30 to-stone-800/40 border border-amber-700/40 rounded-lg backdrop-blur-sm">
          <p className="text-amber-200 text-sm font-['Crimson_Text']">
            {user.role === 'admin' 
              ? "Click on any date to create a new event. Click on existing events to view details, edit, or manage comments. Use the Admin Panel to manage event requests. Click the month title to open the year view and navigate to different months and years."
              : "Click on any event to view details and leave comments. Use the 'Request Event' button to submit event requests for admin approval. Click the month title to open the year view and navigate to different months and years."
            }
          </p>
        </div>
      </div>

      {/* Year View Modal */}
      {isYearViewOpen && (
        <YearView
          currentDate={currentDate}
          events={events}
          onMonthSelect={handleMonthSelect}
          onClose={() => setIsYearViewOpen(false)}
        />
      )}

      {/* Event Popup for viewing/editing events */}
      {isEventPopupOpen && selectedEvent && (
        <EventPopup
          event={selectedEvent}
          onSave={handleEventSave}
          onDelete={handleEventDelete}
          onClose={() => {
            setIsEventPopupOpen(false);
            setSelectedEvent(null);
          }}
          onAddComment={handleAddComment}
          onDeleteComment={handleDeleteComment}
          currentUser={user}
        />
      )}

      {/* Admin Event Creation Modal */}
      {isEventModalOpen && (
        <EventModal
          isOpen={isEventModalOpen}
          onClose={() => {
            setIsEventModalOpen(false);
            setSelectedDate(null);
          }}
          selectedDate={selectedDate}
          onCreateEvent={handleCreateEvent}
          user={user}
        />
      )}

      {/* Event Request Modal */}
      {isRequestModalOpen && (
        <EventRequestModal
          isOpen={isRequestModalOpen}
          onClose={() => setIsRequestModalOpen(false)}
          selectedDate={selectedDate}
          onSubmitRequest={handleSubmitRequest}
          user={user}
        />
      )}

      {/* Admin Panel */}
      {isAdminPanelOpen && user.role === 'admin' && (
        <AdminPanel
          onClose={handleAdminPanelClose}
          user={user}
          onEventCreated={loadData}
        />
      )}
    </div>
  );
};
