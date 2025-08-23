import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { CalendarEvent } from '../types/Event';

interface YearViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  onMonthSelect: (month: number, year?: number) => void;
  onClose: () => void;
}

export const YearView: React.FC<YearViewProps> = ({
  currentDate,
  events,
  onMonthSelect,
  onClose
}) => {
  const [viewYear, setViewYear] = useState(currentDate.getFullYear());
  
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const getEventsForMonth = (monthIndex: number) => {
    return events.filter(event => {
      const eventDate = new Date(event.date);
      return eventDate.getFullYear() === viewYear && eventDate.getMonth() === monthIndex;
    });
  };

  const getDaysInMonth = (monthIndex: number) => {
    return new Date(viewYear, monthIndex + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (monthIndex: number) => {
    return new Date(viewYear, monthIndex, 1).getDay();
  };

  const navigateYear = (direction: 'prev' | 'next') => {
    setViewYear(prev => direction === 'prev' ? prev - 1 : prev + 1);
  };

  const handleMonthClick = (monthIndex: number) => {
    onMonthSelect(monthIndex, viewYear);
  };

  const renderMiniCalendar = (monthIndex: number) => {
    const daysInMonth = getDaysInMonth(monthIndex);
    const firstDay = getFirstDayOfMonth(monthIndex);
    const monthEvents = getEventsForMonth(monthIndex);
    const days = [];

    // Empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="w-7 h-7"></div>);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(viewYear, monthIndex, day);
      const dayEvents = monthEvents.filter(event => {
        const eventDate = new Date(event.date);
        return eventDate.getDate() === day;
      });
      const hasEvents = dayEvents.length > 0;
      const isToday = date.toDateString() === new Date().toDateString();

      days.push(
        <div
          key={day}
          className={`w-7 h-7 text-xs flex items-center justify-center rounded transition-all duration-200 font-['Crimson_Text'] ${
            isToday
              ? 'bg-gradient-to-br from-amber-600 to-amber-700 text-amber-100 font-bold shadow-lg'
              : hasEvents
              ? 'bg-gradient-to-br from-amber-700/40 to-amber-800/30 text-amber-200 font-semibold border border-amber-600/30'
              : 'text-amber-300/70 hover:bg-amber-900/20 hover:text-amber-200'
          }`}
        >
          {day}
        </div>
      );
    }

    return (
      <div
        onClick={() => handleMonthClick(monthIndex)}
        className="bg-gradient-to-br from-stone-800/60 to-amber-900/20 rounded-xl p-5 shadow-lg border-2 border-amber-700/30 cursor-pointer hover:shadow-xl transition-all duration-300 hover:border-amber-600/50 hover:from-stone-700/70 hover:to-amber-800/30 backdrop-blur-sm academic-shadow"
      >
        <div className="text-center mb-4">
          <h3 className="font-bold text-amber-100 text-lg font-['Playfair_Display'] drop-shadow-lg">
            {months[monthIndex]}
          </h3>
          <div className="text-sm text-amber-300/80 mt-1 font-['Crimson_Text'] italic">
            {monthEvents.length} event{monthEvents.length !== 1 ? 's' : ''}
          </div>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(day => (
            <div key={day} className="text-xs text-amber-400/80 font-bold mb-2 font-['Source_Serif_Pro']">
              {day}
            </div>
          ))}
          {days}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
      <div className="bg-gradient-to-br from-stone-900/95 to-amber-900/20 border-2 border-amber-700/50 rounded-xl shadow-2xl max-w-7xl w-full max-h-[90vh] overflow-y-auto academic-shadow backdrop-blur-md">
        <div className="sticky top-0 bg-gradient-to-r from-stone-900/95 via-amber-900/30 to-stone-800/95 text-amber-100 p-6 rounded-t-xl border-b-2 border-amber-700/40">
          <div className="absolute inset-0 bg-gradient-to-r from-amber-900/10 to-stone-900/20 rounded-t-xl"></div>
          <div className="relative flex items-center justify-between">
            {/* Left - Previous Year Button */}
            <button
              onClick={() => navigateYear('prev')}
              className="p-3 hover:bg-amber-800/30 rounded-lg transition-all duration-300 backdrop-blur-sm border border-amber-700/30 academic-shadow group"
              title="Previous Year"
            >
              <ChevronLeft className="w-6 h-6 group-hover:text-amber-200 transition-colors duration-200" />
            </button>

            {/* Center - Year Title */}
            <h2 className="text-3xl font-bold font-['Playfair_Display'] drop-shadow-lg">
              {viewYear} Academic Year
            </h2>

            {/* Right - Next Year Button and Close Button */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigateYear('next')}
                className="p-3 hover:bg-amber-800/30 rounded-lg transition-all duration-300 backdrop-blur-sm border border-amber-700/30 academic-shadow group"
                title="Next Year"
              >
                <ChevronRight className="w-6 h-6 group-hover:text-amber-200 transition-colors duration-200" />
              </button>
              
              <button
                onClick={onClose}
                className="p-3 hover:bg-amber-800/30 rounded-lg transition-all duration-300 backdrop-blur-sm border border-amber-700/30 academic-shadow"
                title="Close"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>

        <div className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {months.map((_, monthIndex) => renderMiniCalendar(monthIndex))}
          </div>
        </div>
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
  );
};
