import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase } from '@/lib/supabase'

export interface UserSettings {
  theme: 'light' | 'dark' | 'system'
  notesPerProject: number
  noteCharLimit: number
}

interface SettingsState extends UserSettings {
  isLoading: boolean
  userId: string | null
  setTheme: (theme: 'light' | 'dark' | 'system') => Promise<void>
  setNotesPerProject: (count: number) => Promise<void>
  setNoteCharLimit: (limit: number) => Promise<void>
  loadUserSettings: () => Promise<void>
}

// Helper function to save settings to Supabase
const saveSettingsToSupabase = async (userId: string, settings: Partial<UserSettings>) => {
  if (!userId) return;

  try {
    // Check if user already has settings
    const { data: existingSettings } = await supabase
      .from('user_settings')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (existingSettings) {
      // Update existing settings
      const { error } = await supabase
        .from('user_settings')
        .update(settings)
        .eq('user_id', userId);

      if (error) throw error;
    } else {
      // Insert new settings
      const { error } = await supabase
        .from('user_settings')
        .insert([{ 
          user_id: userId,
          theme: settings.theme || 'light',
          notes_per_project: settings.notesPerProject || 3,
          note_char_limit: settings.noteCharLimit || 280
        }]);

      if (error) throw error;
    }
  } catch (error) {
    console.error('Error saving settings to Supabase:', error);
    throw error;
  }
};

export const useSettings = create<SettingsState>()(
  persist(
    (set, get) => ({
      theme: 'light',
      notesPerProject: 3,
      noteCharLimit: 280,
      isLoading: false,
      userId: null,

      loadUserSettings: async () => {
        set({ isLoading: true });
        try {
          // Get current user
          const { data: { user } } = await supabase.auth.getUser();
          const userId = user?.id;
          
          set({ userId });

          if (userId) {
            // Fetch user settings from Supabase
            const { data, error } = await supabase
              .from('user_settings')
              .select('*')
              .eq('user_id', userId)
              .single();

            if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned" error
              console.error('Error fetching user settings:', error);
            }

            if (data) {
              // Update state with settings from database
              set({
                theme: data.theme as 'light' | 'dark' | 'system',
                notesPerProject: data.notes_per_project,
                noteCharLimit: data.note_char_limit,
              });
            } else {
              // No settings found for user, create default settings
              await saveSettingsToSupabase(userId, {
                theme: get().theme,
                notesPerProject: get().notesPerProject,
                noteCharLimit: get().noteCharLimit
              });
            }
          }
        } catch (error) {
          console.error('Error loading user settings:', error);
        } finally {
          set({ isLoading: false });
        }
      },

      setTheme: async (theme) => {
        set({ theme });
        const { userId } = get();
        if (userId) {
          try {
            await saveSettingsToSupabase(userId, { theme });
          } catch (error) {
            console.error('Failed to save theme to database:', error);
          }
        }
      },

      setNotesPerProject: async (count) => {
        set({ notesPerProject: count });
        const { userId } = get();
        if (userId) {
          try {
            await saveSettingsToSupabase(userId, { notesPerProject: count });
          } catch (error) {
            console.error('Failed to save notesPerProject to database:', error);
          }
        }
      },

      setNoteCharLimit: async (limit) => {
        set({ noteCharLimit: limit });
        const { userId } = get();
        if (userId) {
          try {
            await saveSettingsToSupabase(userId, { noteCharLimit: limit });
          } catch (error) {
            console.error('Failed to save noteCharLimit to database:', error);
          }
        }
      },
    }),
    {
      name: 'wannakeep-settings',
    }
  )
) 