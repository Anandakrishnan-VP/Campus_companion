import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Tenant {
  id: string;
  name: string;
  slug: string;
  logo_url: string;
  website_url: string;
  primary_color: string;
  status: string;
}

interface TenantContextType {
  tenant: Tenant | null;
  tenantId: string | null;
  loading: boolean;
  error: string | null;
  allTenants: Tenant[];
  isPlatformHome: boolean;
  setTenantBySlug: (slug: string) => void;
}

const TenantContext = createContext<TenantContextType>({
  tenant: null,
  tenantId: null,
  loading: true,
  error: null,
  allTenants: [],
  isPlatformHome: false,
  setTenantBySlug: () => {},
});

export const useTenant = () => useContext(TenantContext);

function resolveSlugFromHostname(): string | null {
  const hostname = window.location.hostname;
  // Pattern: {slug}.domain or {slug}-preview--xxx.lovable.app
  // For local dev, use query param ?tenant=slug
  const params = new URLSearchParams(window.location.search);
  if (params.get("tenant")) return params.get("tenant");

  // Check subdomain pattern
  const parts = hostname.split(".");
  if (parts.length >= 3) {
    const sub = parts[0];
    // Skip "id-preview--xxx" style subdomains (lovable preview)
    if (sub.includes("preview--")) return null;
    return sub;
  }
  return null;
}

export function TenantProvider({ children }: { children: ReactNode }) {
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [allTenants, setAllTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTenants = async () => {
    const { data } = await supabase.from("tenants").select("*").eq("status", "active");
    const tenants = (data || []) as Tenant[];
    setAllTenants(tenants);
    return tenants;
  };

  const setTenantBySlug = (slug: string) => {
    const found = allTenants.find(t => t.slug === slug || (t as any).abbreviation === slug);
    if (found) {
      setTenant(found);
      localStorage.setItem("selected_tenant_slug", slug);
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const tenants = await fetchTenants();
        const slug = resolveSlugFromHostname() || localStorage.getItem("selected_tenant_slug");
        
        if (slug) {
          const found = tenants.find(t => t.slug === slug);
          if (found) {
            setTenant(found);
          }
        }
        // No auto-select — if no slug resolved, tenant stays null (platform home)
      } catch (e) {
        setError("Failed to load tenant");
      }
      setLoading(false);
    })();
  }, []);

  return (
    <TenantContext.Provider value={{
      tenant,
      tenantId: tenant?.id || null,
      loading,
      error,
      allTenants,
      isPlatformHome: !tenant && !loading,
      setTenantBySlug,
    }}>
      {children}
    </TenantContext.Provider>
  );
}
