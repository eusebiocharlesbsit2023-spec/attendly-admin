import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import supabase from "../helper/supabaseClient";

export default function Dashboard_Wrapper() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) return null;               // or a spinner overlay
  if (!session) return <Navigate to="/" replace />;

  return <Outlet />;
}
