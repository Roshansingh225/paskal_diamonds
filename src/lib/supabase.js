import { createClient } from '@supabase/supabase-js';
import { mockProducts } from './mockProducts';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const hasSupabaseConfig = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = hasSupabaseConfig
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export const formatCurrency = (value) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

export async function getProducts() {
  if (!supabase) return mockProducts;

  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function getProduct(id) {
  if (!supabase) return mockProducts.find((product) => product.id === id);

  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

export async function upsertProfile(user, profile = {}) {
  if (!supabase || !user) return null;

  const payload = {
    id: user.id,
    email: user.email,
    name: profile.name || user.user_metadata?.name || '',
    phone: profile.phone || user.phone || '',
    role: 'user',
  };

  const { data, error } = await supabase
    .from('users')
    .upsert(payload, { onConflict: 'id', ignoreDuplicates: false })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function fetchProfile(userId) {
  if (!supabase || !userId) return null;

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data;
}
