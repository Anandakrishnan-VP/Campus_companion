import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

const CACHE_PREFIX = "offline_cache_";
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

interface CacheEntry<T> {
  data: T[];
  timestamp: number;
}

function getCached<T>(key: string): T[] | null {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + key);
    if (!raw) return null;
    const entry: CacheEntry<T> = JSON.parse(raw);
    // Return cached data regardless of age when offline
    if (!navigator.onLine) return entry.data;
    // When online, only use cache if fresh
    if (Date.now() - entry.timestamp < CACHE_TTL) return entry.data;
    return null;
  } catch {
    return null;
  }
}

function setCache<T>(key: string, data: T[]) {
  try {
    const entry: CacheEntry<T> = { data, timestamp: Date.now() };
    localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(entry));
  } catch {
    // localStorage full — silently fail
  }
}

type CacheableTable = "faculty" | "locations" | "timetable" | "departments" | "events" | "emergency_contacts";

export function useOfflineCache(table: CacheableTable) {
  const [data, setData] = useState<any[]>(() => getCached(table) || []);
  const [loading, setLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  const fetchData = useCallback(async () => {
    if (!navigator.onLine) {
      const cached = getCached(table);
      if (cached) setData(cached);
      setLoading(false);
      return;
    }
    try {
      const { data: rows, error } = await (supabase.from(table) as any)
        .select("*")
        .order("created_at", { ascending: false });
      if (!error && rows) {
        setData(rows);
        setCache(table, rows);
      }
    } catch {
      // Network error — fall back to cache
      const cached = getCached(table);
      if (cached) setData(cached);
    }
    setLoading(false);
  }, [table]);

  useEffect(() => {
    fetchData();

    const handleOnline = () => {
      setIsOffline(false);
      fetchData();
    };
    const handleOffline = () => setIsOffline(true);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Realtime updates when online
    const channelId = `offline-${table}-${Date.now()}`;
    const channel = supabase
      .channel(channelId)
      .on("postgres_changes" as any, { event: "*", schema: "public", table } as any, () => {
        fetchData();
      })
      .subscribe();

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      supabase.removeChannel(channel);
    };
  }, [table, fetchData]);

  return { data, loading, isOffline, refetch: fetchData };
}

/**
 * Pre-cache all key tables on app startup so offline data is available immediately
 */
export async function preCacheKeyData() {
  const tables: CacheableTable[] = ["faculty", "locations", "timetable", "departments", "events", "emergency_contacts"];
  
  if (!navigator.onLine) return;

  await Promise.allSettled(
    tables.map(async (table) => {
      try {
        const { data: rows } = await (supabase.from(table) as any)
          .select("*")
          .order("created_at", { ascending: false });
        if (rows) setCache(table, rows);
      } catch {
        // silently fail
      }
    })
  );
}
