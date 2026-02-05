import { useState, useEffect, useRef } from "react";
import supabase from "../helper/supabaseClient";
import { getNotifications } from "../lib/notifications";

/**
 * Custom Hook for handling global notifications.
 * Pure logic, no JSX, so .js extension is appropriate.
 */
export function useNotifications() {
  const [realActivity, setRealActivity] = useState([]);
  const [activityLoading, setActivityLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [activityOpen, setActivityOpen] = useState(false);
  const [activityAnchorRect, setActivityAnchorRect] = useState(null);
  const notifRef = useRef(null);

  // Function to update the unread dot count
  const refreshUnreadCount = () => {
    try {
      const notes = getNotifications() || [];
      setUnreadCount(notes.filter((n) => !n.read).length);
    } catch (e) {
      setUnreadCount(0);
    }
  };

  // Fetch initial 20 activities from Supabase
  const fetchActivities = async () => {
    setActivityLoading(true);
    try {
      const { data, error } = await supabase
        .from("recent_activities")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;

      // Format for the ActivityHistoryModal items prop
      setRealActivity((data || []).map(act => ({
        id: act.id,
        text: act.message,
        time: formatTimeAgo(act.created_at),
      })));
    } catch (e) {
      console.error("fetchActivities error:", e);
    } finally {
      setActivityLoading(false);
    }
  };

  // Helper to format timestamps relative to now
  function formatTimeAgo(dateString) {
    const now = new Date();
    const past = new Date(dateString);
    const diffInMs = now - past;
    const diffInMins = Math.floor(diffInMs / 60000);
    if (diffInMins < 1) return "Just now";
    if (diffInMins < 60) return `${diffInMins}m ago`;
    const diffInHours = Math.floor(diffInMins / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return past.toLocaleDateString();
  }

  // Effect for initial load and Realtime subscription
  useEffect(() => {
    fetchActivities();
    refreshUnreadCount();

    const channel = supabase
      .channel('global-notifications')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'recent_activities' }, 
        () => {
          // Re-fetch and update count when new activity is inserted
          fetchActivities();
          refreshUnreadCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Handler to open the modal and capture the bell's position
  const openNotif = () => {
    if (notifRef.current) {
      setActivityAnchorRect(notifRef.current.getBoundingClientRect());
    }
    setActivityOpen(true);
  };

  return {
    realActivity,
    activityLoading,
    unreadCount,
    activityOpen,
    setActivityOpen,
    activityAnchorRect,
    notifRef,
    openNotif,
    refreshUnreadCount
  };
}