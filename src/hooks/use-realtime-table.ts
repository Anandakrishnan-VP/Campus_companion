import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";

type TableName = "faculty" | "timetable" | "events" | "locations" | "attendance";

export function useRealtimeTable<T extends Tables<TableName>>(table: TableName, filter?: { column: string; value: string }) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    let query = supabase.from(table).select("*");
    if (filter) {
      query = query.eq(filter.column, filter.value);
    }
    const { data: rows } = await query.order("created_at", { ascending: false });
    setData((rows as T[]) || []);
    setLoading(false);
  }, [table, filter?.column, filter?.value]);

  useEffect(() => {
    fetchData();

    const channel = supabase
      .channel(`${table}-changes`)
      .on("postgres_changes", { event: "*", schema: "public", table }, () => {
        fetchData();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [table, fetchData]);

  return { data, loading, refetch: fetchData };
}
