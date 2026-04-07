import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

export type AppRole = "admin" | "professor" | "super_admin";

export function useAuth(requiredRole?: AppRole) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [facultyId, setFacultyId] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!session?.user) {
        setUser(null);
        setRole(null);
        setFacultyId(null);
        setLoading(false);
        if (requiredRole) navigate("/login");
        return;
      }

      setUser(session.user);

      // Fetch role - check for highest role
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id);

      // Prioritize super_admin > admin > professor
      const roleList = roles?.map(r => r.role as AppRole) || [];
      const userRole = roleList.includes("super_admin") ? "super_admin" : roleList.includes("admin") ? "admin" : roleList[0] as AppRole | undefined;
      setRole(userRole || null);

      if (requiredRole && userRole !== requiredRole) {
        navigate("/login");
        return;
      }

      // If professor, get their faculty record
      if (userRole === "professor") {
        const { data: faculty } = await supabase
          .from("faculty")
          .select("id")
          .eq("user_id", session.user.id)
          .maybeSingle();
        setFacultyId(faculty?.id || null);
      }

      setLoading(false);
    });

    // Initial session check
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session?.user) {
        setLoading(false);
        if (requiredRole) navigate("/login");
        return;
      }
      setUser(session.user);

      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id);

      const userRole = roles?.[0]?.role as AppRole | undefined;
      setRole(userRole || null);

      if (requiredRole && userRole !== requiredRole) {
        navigate("/login");
        return;
      }

      if (userRole === "professor") {
        const { data: faculty } = await supabase
          .from("faculty")
          .select("id")
          .eq("user_id", session.user.id)
          .maybeSingle();
        setFacultyId(faculty?.id || null);
      }

      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [requiredRole, navigate]);

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  return { user, role, loading, facultyId, signOut };
}
