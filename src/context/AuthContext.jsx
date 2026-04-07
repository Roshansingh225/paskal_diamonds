import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { fetchProfile, hasSupabaseConfig, supabase, upsertProfile } from '../lib/supabase';

const AuthContext = createContext(null);

async function fetchProfileWithTimeout(userId) {
  return Promise.race([
    fetchProfile(userId),
    new Promise((_, reject) => {
      window.setTimeout(() => reject(new Error('Profile lookup timed out.')), 6000);
    }),
  ]);
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return undefined;
    }

    let mounted = true;

    async function bootstrapAuth() {
      try {
        const { data } = await supabase.auth.getSession();
        if (!mounted) return;

        setSession(data.session);
        if (data.session?.user) {
          try {
            const nextProfile = await fetchProfileWithTimeout(data.session.user.id);
            if (mounted) setProfile(nextProfile);
          } catch {
            if (mounted) setProfile(null);
          }
        } else {
          setProfile(null);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    bootstrapAuth();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setLoading(false);

      if (nextSession?.user) {
        window.setTimeout(async () => {
          try {
            const nextProfile = await fetchProfileWithTimeout(nextSession.user.id);
            if (mounted) setProfile(nextProfile);
          } catch {
            if (mounted) setProfile(null);
          }
        }, 0);
      } else {
        setProfile(null);
      }
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  async function signUp({ email, password, name, phone }) {
    if (!supabase) throw new Error('Add Supabase keys to .env to enable authentication.');

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name, phone } },
    });

    if (error) throw error;
    if (data.session && data.user) {
      const savedProfile = await upsertProfile(data.user, { name, phone });
      setProfile(savedProfile);
    }
    return data;
  }

  async function signIn({ email, password }) {
    if (!supabase) throw new Error('Add Supabase keys to .env to enable authentication.');

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  }

  async function sendOtp({ email, phone }) {
    if (!supabase) throw new Error('Add Supabase keys to .env to enable OTP login.');

    if (phone) {
      const { data, error } = await supabase.auth.signInWithOtp({ phone });
      if (error) throw error;
      return data;
    }

    const { data, error } = await supabase.auth.signInWithOtp({ email });
    if (error) throw error;
    return data;
  }

  async function verifyOtp({ phone, token }) {
    if (!supabase) throw new Error('Add Supabase keys to .env to enable OTP login.');

    const { data, error } = await supabase.auth.verifyOtp({ phone, token, type: 'sms' });
    if (error) throw error;
    return data;
  }

  async function refreshProfile() {
    const currentUser = session?.user;
    if (!currentUser) return null;

    const nextProfile = await fetchProfileWithTimeout(currentUser.id);
    setProfile(nextProfile);
    return nextProfile;
  }

  async function signOut() {
    setSession(null);
    setProfile(null);

    if (!supabase) return;

    const { error } = await supabase.auth.signOut({ scope: 'local' });
    if (error) throw error;
  }

  const value = useMemo(
    () => ({
      user: session?.user || null,
      session,
      profile,
      isAdmin: profile?.role === 'admin',
      loading,
      hasSupabaseConfig,
      signUp,
      signIn,
      sendOtp,
      verifyOtp,
      refreshProfile,
      signOut,
    }),
    [session, profile, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
