// Supabase is not used in this project. The app uses the Django backend with SQLite/MySQL.
export const supabase = {
  auth: {
    getUser: async () => ({ data: { user: null }, error: null }),
    signOut: async () => ({ error: null }),
  },
  functions: {
    invoke: async () => ({ data: null, error: new Error("Supabase is disabled. Using local backend.") }),
  },
};
