import { supabase } from '../lib/supabase';
import { User } from '../types/User';
import { CalendarEvent } from '../types/Event';
import { EventRequest } from '../types/EventRequest';
import { Comment } from '../types/Comment';

export const userService = {
  async createUser(userData: {
    id: string;
    email: string;
    username: string;
    role: 'user' | 'admin';
  }): Promise<User> {
    try {
      const { data, error } = await supabase
        .from('users')
        .insert({
          id: userData.id,
          email: userData.email,
          username: userData.username,
          role: userData.role
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create user profile: ${error.message}`);
      }
      
      if (!data) {
        throw new Error('No data returned from user creation');
      }
      
      return {
        id: data.id,
        email: data.email,
        username: data.username,
        role: data.role
      };
    } catch (error: any) {
      throw error;
    }
  },

  async getUserByUsername(username: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw error;
    }
    
    return {
      id: data.id,
      email: data.email,
      username: data.username,
      role: data.role
    };
  },

  async getUserByEmail(email: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email.trim().toLowerCase())
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw error;
    }
    
    return {
      id: data.id,
      email: data.email,
      username: data.username,
      role: data.role
    };
  },

  async getUserById(id: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw error;
    }
    
    return {
      id: data.id,
      email: data.email,
      username: data.username,
      role: data.role
    };
  },

  async getAllUsers(): Promise<User[]> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }
    
    return data.map(user => ({
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role
    }));
  }
};

export const eventService = {
  async createEvent(eventData: {
    title: string;
    description: string;
    date: string;
    time: string;
    venue: string;
    created_by: string;
  }): Promise<CalendarEvent> {
    if (!eventData.created_by) {
      throw new Error('User ID is required to create an event');
    }

    try {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('role, username')
        .eq('id', eventData.created_by)
        .single();

      if (userError) {
        throw new Error('User verification failed');
      }

      if (userData.role !== 'admin') {
        throw new Error('Only administrators can create events');
      }

      const { data, error } = await supabase
        .from('events')
        .insert([{
          title: eventData.title,
          description: eventData.description,
          date: eventData.date,
          time: eventData.time,
          venue: eventData.venue,
          created_by: eventData.created_by
        }])
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create event: ${error.message}`);
      }

      const { data: verifyData, error: verifyError } = await supabase
        .from('events')
        .select('*')
        .eq('id', data.id)
        .single();

      if (verifyError || !verifyData) {
        throw new Error('Event creation verification failed');
      }

      const createdEvent = {
        id: data.id,
        title: data.title,
        description: data.description,
        date: new Date(data.date + 'T00:00:00'),
        time: data.time,
        venue: data.venue,
        comments: []
      };

      return createdEvent;
    } catch (error: any) {
      throw error;
    }
  },

  async createEventFromRequest(requestData: {
    title: string;
    description: string;
    date: string;
    time: string;
    venue: string;
    created_by: string;
  }): Promise<CalendarEvent> {
    if (!requestData.created_by) {
      throw new Error('User ID is required to create an event');
    }

    try {
      const { data, error } = await supabase
        .from('events')
        .insert([{
          title: requestData.title,
          description: requestData.description,
          date: requestData.date,
          time: requestData.time,
          venue: requestData.venue,
          created_by: requestData.created_by
        }])
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create event from request: ${error.message}`);
      }

      const { data: verifyData, error: verifyError } = await supabase
        .from('events')
        .select('*')
        .eq('id', data.id)
        .single();

      if (verifyError || !verifyData) {
        throw new Error('Event creation verification failed');
      }

      const createdEvent = {
        id: data.id,
        title: data.title,
        description: data.description,
        date: new Date(data.date + 'T00:00:00'),
        time: data.time,
        venue: data.venue,
        comments: []
      };

      return createdEvent;
    } catch (error: any) {
      throw error;
    }
  },

  async getAllEvents(): Promise<CalendarEvent[]> {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('date', { ascending: true });

      if (error) {
        throw error;
      }

      if (!data || data.length === 0) {
        return [];
      }

      const eventsWithComments = await Promise.all(
        data.map(async (event) => {
          try {
            const comments = await commentService.getEventComments(event.id);
            const eventDate = new Date(event.date + 'T00:00:00');
            
            const processedEvent = {
              id: event.id,
              title: event.title,
              description: event.description,
              date: eventDate,
              time: event.time,
              venue: event.venue,
              comments
            };

            return processedEvent;
          } catch (commentError) {
            return {
              id: event.id,
              title: event.title,
              description: event.description,
              date: new Date(event.date + 'T00:00:00'),
              time: event.time,
              venue: event.venue,
              comments: []
            };
          }
        })
      );

      return eventsWithComments;
    } catch (error: any) {
      throw error;
    }
  },

  async updateEvent(eventId: string, updates: Partial<{
    title: string;
    description: string;
    date: string;
    time: string;
    venue: string;
  }>): Promise<CalendarEvent> {
    const { data, error } = await supabase
      .from('events')
      .update(updates)
      .eq('id', eventId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    const comments = await commentService.getEventComments(eventId);

    return {
      id: data.id,
      title: data.title,
      description: data.description,
      date: new Date(data.date + 'T00:00:00'),
      time: data.time,
      venue: data.venue,
      comments
    };
  },

  async deleteEvent(eventId: string): Promise<void> {
    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', eventId);

    if (error) {
      throw error;
    }
  }
};

export const commentService = {
  async createComment(commentData: {
    event_id: string;
    text: string;
    author: string;
  }): Promise<Comment> {
    const { data, error } = await supabase
      .from('comments')
      .insert([commentData])
      .select()
      .single();

    if (error) {
      throw error;
    }

    return {
      id: data.id,
      text: data.text,
      author: data.author,
      timestamp: new Date(data.created_at)
    };
  },

  async getEventComments(eventId: string): Promise<Comment[]> {
    const { data, error } = await supabase
      .from('comments')
      .select('*')
      .eq('event_id', eventId)
      .order('created_at', { ascending: true });

    if (error) {
      return [];
    }

    return (data || []).map(comment => ({
      id: comment.id,
      text: comment.text,
      author: comment.author,
      timestamp: new Date(comment.created_at)
    }));
  },

  async deleteComment(commentId: string): Promise<void> {
    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', commentId);

    if (error) {
      throw error;
    }
  }
};

export const eventRequestService = {
  async createEventRequest(requestData: {
    title: string;
    description: string;
    date: string;
    time: string;
    venue: string;
    requested_by: string;
  }): Promise<EventRequest> {
    if (!requestData.requested_by) {
      throw new Error('User ID is required to create an event request');
    }

    try {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('username')
        .eq('id', requestData.requested_by)
        .single();

      if (userError) {
        throw new Error('User verification failed');
      }

      const dbRequestData = {
        title: requestData.title,
        description: requestData.description,
        date: requestData.date,
        time: requestData.time,
        venue: requestData.venue,
        requested_by: requestData.requested_by,
        status: 'pending' as const
      };
      
      const { data, error } = await supabase
        .from('event_requests')
        .insert([dbRequestData])
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create event request: ${error.message}`);
      }

      return {
        id: data.id,
        title: data.title,
        description: data.description,
        date: new Date(data.date + 'T00:00:00'),
        time: data.time,
        venue: data.venue,
        requestedBy: data.requested_by,
        requesterName: userData.username,
        status: data.status,
        adminNotes: data.admin_notes || '',
        reviewedBy: data.reviewed_by || undefined,
        reviewerName: undefined,
        reviewedAt: data.reviewed_at ? new Date(data.reviewed_at) : undefined,
        createdAt: new Date(data.created_at)
      };
    } catch (error: any) {
      throw error;
    }
  },

  async getAllEventRequests(): Promise<EventRequest[]> {
    const { data, error } = await supabase
      .from('event_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    const requestsWithNames = await Promise.all(
      data.map(async (request) => {
        let requesterName = 'Unknown User';
        let reviewerName = undefined;

        try {
          const { data: requesterData } = await supabase
            .from('users')
            .select('username')
            .eq('id', request.requested_by)
            .single();
          
          if (requesterData) {
            requesterName = requesterData.username;
          }

          if (request.reviewed_by) {
            const { data: reviewerData } = await supabase
              .from('users')
              .select('username')
              .eq('id', request.reviewed_by)
              .single();
            
            if (reviewerData) {
              reviewerName = reviewerData.username;
            }
          }
        } catch (err) {
          // Silently handle user lookup errors
        }

        return {
          id: request.id,
          title: request.title,
          description: request.description,
          date: new Date(request.date + 'T00:00:00'),
          time: request.time,
          venue: request.venue,
          requestedBy: request.requested_by,
          requesterName,
          status: request.status,
          adminNotes: request.admin_notes || '',
          reviewedBy: request.reviewed_by || undefined,
          reviewerName,
          reviewedAt: request.reviewed_at ? new Date(request.reviewed_at) : undefined,
          createdAt: new Date(request.created_at)
        };
      })
    );

    return requestsWithNames;
  },

  async updateEventRequest(requestId: string, updates: {
    status: 'pending' | 'approved' | 'denied';
    admin_notes?: string;
    reviewed_by: string;
    reviewed_at: string;
  }): Promise<EventRequest> {
    try {
      const { data: existingRequest, error: fetchError } = await supabase
        .from('event_requests')
        .select('*')
        .eq('id', requestId)
        .single();

      if (fetchError) {
        throw new Error(`Request not found: ${fetchError.message}`);
      }

      const { data: currentUser, error: userError } = await supabase
        .from('users')
        .select('role')
        .eq('id', updates.reviewed_by)
        .single();

      if (userError) {
        throw new Error(`User verification failed: ${userError.message}`);
      }

      if (currentUser.role !== 'admin') {
        throw new Error('Only administrators can approve or deny requests');
      }

      if (updates.status === 'approved') {
        try {
          const createdEvent = await eventService.createEventFromRequest({
            title: existingRequest.title,
            description: existingRequest.description,
            date: existingRequest.date,
            time: existingRequest.time,
            venue: existingRequest.venue,
            created_by: existingRequest.requested_by
          });
        } catch (eventError) {
          throw new Error(`Failed to create event from approved request: ${eventError.message}`);
        }
      }

      const { data, error } = await supabase
        .from('event_requests')
        .update({
          status: updates.status,
          admin_notes: updates.admin_notes || '',
          reviewed_by: updates.reviewed_by,
          reviewed_at: updates.reviewed_at
        })
        .eq('id', requestId)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update request: ${error.message}`);
      }

      let requesterName = 'Unknown User';
      let reviewerName = 'Unknown Admin';

      try {
        const { data: requesterData } = await supabase
          .from('users')
          .select('username')
          .eq('id', data.requested_by)
          .single();
        
        if (requesterData) {
          requesterName = requesterData.username;
        }

        const { data: reviewerData } = await supabase
          .from('users')
          .select('username')
          .eq('id', data.reviewed_by)
          .single();
        
        if (reviewerData) {
          reviewerName = reviewerData.username;
        }
      } catch (err) {
        // Silently handle user lookup errors
      }

      const finalResult = {
        id: data.id,
        title: data.title,
        description: data.description,
        date: new Date(data.date + 'T00:00:00'),
        time: data.time,
        venue: data.venue,
        requestedBy: data.requested_by,
        requesterName,
        status: data.status,
        adminNotes: data.admin_notes || '',
        reviewedBy: data.reviewed_by || undefined,
        reviewerName,
        reviewedAt: data.reviewed_at ? new Date(data.reviewed_at) : undefined,
        createdAt: new Date(data.created_at)
      };

      return finalResult;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      } else {
        throw new Error('Unknown error occurred while updating request');
      }
    }
  },

  async deleteEventRequest(requestId: string): Promise<void> {
    const { error } = await supabase
      .from('event_requests')
      .delete()
      .eq('id', requestId);

    if (error) {
      throw error;
    }
  }
};
