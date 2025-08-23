export interface Comment {
  id: string;
  text: string;
  timestamp: Date;
  author: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  date: Date;
  time: string;
  venue?: string;
  comments: Comment[];
  createdBy?: string;
  createdByName?: string;
}

export interface EventRequest {
  id: string;
  title: string;
  description: string;
  date: Date;
  time: string;
  venue?: string;
  requestedBy: string;
  requestedByName: string;
  requestedAt: Date;
  status: 'pending' | 'approved' | 'denied';
  adminNotes?: string;
  reviewedBy?: string;
  reviewedAt?: Date;
}
