import { supabase } from '../lib/supabase';
import { User } from '../types/User';

export const authService = {
  async signUp(userData: {
    email: string;
    password: string;
    username: string;
    role: 'user' | 'admin';
  }): Promise<{ user: User; session: any }> {
    console.log('AuthService: Starting signup process for:', userData.email);

    try {
      // Clean and validate input
      const email = userData.email.trim().toLowerCase();
      const username = userData.username.trim();
      const password = userData.password.trim();

      if (!email || !username || !password) {
        throw new Error('All fields are required');
      }

      if (password.length < 6) {
        throw new Error('Password must be at least 6 characters long');
      }

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw new Error('Please enter a valid email address');
      }

      // Check for existing users in our database first
      console.log('AuthService: Checking for existing users...');
      
      const { data: existingUsers, error: checkError } = await supabase
        .from('users')
        .select('email, username')
        .or(`email.eq.${email},username.eq.${username}`);

      if (checkError) {
        console.error('AuthService: Error checking existing users:', checkError);
        // Don't throw here, continue with auth signup which will handle duplicates
      }

      if (existingUsers && existingUsers.length > 0) {
        const emailExists = existingUsers.some(u => u.email === email);
        const usernameExists = existingUsers.some(u => u.username === username);
        
        if (emailExists) {
          throw new Error('An account with this email already exists');
        }
        if (usernameExists) {
          throw new Error('This username is already taken');
        }
      }

      // BYPASS SUPABASE AUTH ENTIRELY - Create user directly in our database
      console.log('AuthService: Creating user directly in database to bypass email verification...');
      
      // Generate a UUID for the user
      const userId = crypto.randomUUID();
      
      // Create user profile directly in our database
      const { data: profileData, error: profileError } = await supabase
        .from('users')
        .insert({
          id: userId,
          email: email,
          username: username,
          role: userData.role,
          email_verified: true
        })
        .select()
        .single();

      if (profileError) {
        console.error('AuthService: Profile creation error:', profileError);
        
        if (profileError.message.includes('duplicate key')) {
          if (profileError.message.includes('email')) {
            throw new Error('An account with this email already exists');
          }
          if (profileError.message.includes('username')) {
            throw new Error('This username is already taken');
          }
        }
        
        throw new Error(`Failed to create user profile: ${profileError.message}`);
      }

      console.log('AuthService: Profile created successfully:', profileData);

      // Store password hash in a separate table for authentication
      const { error: authError } = await supabase
        .from('user_auth')
        .insert({
          user_id: userId,
          email: email,
          password_hash: await this.hashPassword(password)
        });

      if (authError) {
        console.error('AuthService: Auth data creation error:', authError);
        // Clean up the user profile
        await supabase.from('users').delete().eq('id', userId);
        throw new Error('Failed to create authentication data');
      }

      const user: User = {
        id: profileData.id,
        email: profileData.email,
        username: profileData.username,
        role: profileData.role
      };

      // Create a mock session object
      const mockSession = {
        access_token: 'mock_token_' + userId,
        refresh_token: 'mock_refresh_' + userId,
        expires_in: 3600,
        token_type: 'bearer',
        user: {
          id: userId,
          email: email
        }
      };

      console.log('AuthService: Registration completed successfully with immediate access');
      return { user, session: mockSession };

    } catch (error: any) {
      console.error('AuthService: Registration error:', error);
      throw error;
    }
  },

  async signIn(email: string, password: string): Promise<{ user: User; session: any }> {
    console.log('AuthService: Starting signin for:', email);

    try {
      const normalizedEmail = email.trim().toLowerCase();
      const trimmedPassword = password.trim();

      if (!normalizedEmail || !trimmedPassword) {
        throw new Error('Email and password are required');
      }

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(normalizedEmail)) {
        throw new Error('Please enter a valid email address');
      }

      // Get user from our custom auth table
      console.log('AuthService: Checking custom authentication...');
      const { data: authData, error: authError } = await supabase
        .from('user_auth')
        .select('user_id, password_hash')
        .eq('email', normalizedEmail)
        .single();

      if (authError || !authData) {
        console.error('AuthService: User not found in custom auth');
        throw new Error('Invalid email or password');
      }

      // Verify password
      const isValidPassword = await this.verifyPassword(trimmedPassword, authData.password_hash);
      if (!isValidPassword) {
        throw new Error('Invalid email or password');
      }

      // Get user profile
      const { data: userProfile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authData.user_id)
        .single();

      if (profileError || !userProfile) {
        console.error('AuthService: Profile not found');
        throw new Error('User profile not found');
      }

      const user: User = {
        id: userProfile.id,
        email: userProfile.email,
        username: userProfile.username,
        role: userProfile.role
      };

      // Create a mock session object
      const mockSession = {
        access_token: 'mock_token_' + userProfile.id,
        refresh_token: 'mock_refresh_' + userProfile.id,
        expires_in: 3600,
        token_type: 'bearer',
        user: {
          id: userProfile.id,
          email: userProfile.email
        }
      };

      console.log('AuthService: Signin completed successfully');
      return { user, session: mockSession };

    } catch (error: any) {
      console.error('AuthService: Signin error:', error);
      throw error;
    }
  },

  async signOut(): Promise<void> {
    console.log('AuthService: Signing out...');
    // Clear any stored session data
    localStorage.removeItem('ppmk_session');
    console.log('AuthService: Signed out successfully');
  },

  async getCurrentUser(): Promise<User | null> {
    console.log('AuthService: Getting current user...');
    
    try {
      // Check for stored session
      const storedSession = localStorage.getItem('ppmk_session');
      if (!storedSession) {
        console.log('AuthService: No stored session');
        return null;
      }

      const session = JSON.parse(storedSession);
      const userId = session.user?.id;

      if (!userId) {
        console.log('AuthService: No user ID in session');
        return null;
      }

      const { data: userProfile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError || !userProfile) {
        console.error('AuthService: Profile not found for stored user');
        localStorage.removeItem('ppmk_session');
        return null;
      }

      const user: User = {
        id: userProfile.id,
        email: userProfile.email,
        username: userProfile.username,
        role: userProfile.role
      };

      console.log('AuthService: Current user retrieved successfully');
      return user;

    } catch (error) {
      console.error('AuthService: Error getting current user:', error);
      localStorage.removeItem('ppmk_session');
      return null;
    }
  },

  // Helper methods for password hashing
  async hashPassword(password: string): Promise<string> {
    // Simple hash for demo - in production use bcrypt or similar
    const encoder = new TextEncoder();
    const data = encoder.encode(password + 'ppmk_salt');
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  },

  async verifyPassword(password: string, hash: string): Promise<boolean> {
    const passwordHash = await this.hashPassword(password);
    return passwordHash === hash;
  }
};
