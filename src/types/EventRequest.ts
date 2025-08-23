export interface EventRequest {
  id: string;
  title: string;
  description: string;
  date: Date;
  time: string;
  venue: string;
  requestedBy: string;
  requesterName?: string;
  status: 'pending' | 'approved' | 'denied';
  adminNotes: string;
  reviewedBy?: string;
  reviewerName?: string;
  reviewedAt?: Date;
  createdAt: Date;
}
