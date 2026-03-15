import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useRealtimeTable(table: "faculty" | "timetable" | "events" | "locations" | "attendance" | "notifications" | "knowledge_base" | "departments" | "emergency_contacts", filter?: { column: string; value: string }) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    let query = (supabase.from(table) as any).select("*");
    if (filter) {
      query = query.eq(filter.column, filter.value);
    }
    const { data: rows } = await query.order("created_at", { ascending: false });
    setData(rows || []);
    setLoading(false);
  }, [table, filter?.column, filter?.value]);

  useEffect(() => {
    fetchData();

    const channel = supabase
      .channel(`${table}-changes-${Math.random()}`)
      .on("postgres_changes" as any, { event: "*", schema: "public", table } as any, () => {
        fetchData();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [table, fetchData]);

  return { data, loading, refetch: fetchData };
}
