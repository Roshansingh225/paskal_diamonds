import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ adminOnly = false, children }) {
  const { user, isAdmin, loading, hasSupabaseConfig, refreshProfile } = useAuth();

  if (loading) return <section className="page narrow"><p>Preparing your vault...</p></section>;

  if (!hasSupabaseConfig) {
    return (
      <section className="page narrow">
        <h1>Supabase keys required</h1>
        <p>Add your project URL and anon key to `.env` to use the secure admin dashboard.</p>
      </section>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;
  if (adminOnly && !isAdmin) {
    return (
      <section className="page narrow access-card">
        <p className="eyebrow">Admin access</p>
        <h1>Admin role required.</h1>
        <p>
          You are signed in as {user.email || 'this user'}, but this account is not marked as admin in Supabase yet.
        </p>
        <pre>{`update users
set role = 'admin'
where email = '${user.email || 'your-email@example.com'}';`}</pre>
        <p>Run this in Supabase SQL editor, then refresh this page.</p>
        <div className="button-row">
          <button className="button primary" onClick={refreshProfile}>Refresh admin access</button>
          <Link className="button secondary" to="/products">Back to collection</Link>
        </div>
      </section>
    );
  }

  return children;
}
