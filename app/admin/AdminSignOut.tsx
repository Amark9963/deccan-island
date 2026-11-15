'use client';
import { getSupabaseBrowser } from '@/lib/supabase-browser';
export default function AdminSignOut() { return <button className="admin-signout" onClick={async () => { await getSupabaseBrowser().auth.signOut(); window.location.href = '/admin/login'; }}>Sign out</button>; }
