import React, { createContext, useContext, useState, useEffect } from "react";
import api from "../api/api";

const TenantContext = createContext(null);

const getInitialTenant = () => {
  if (typeof window === "undefined") return null;
  try {
    const host = window.location.host;
    const cached = localStorage.getItem(`hc_tenant_${host}`);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed && typeof parsed === "object") return parsed;
    }
  } catch {}
  return null;
};

export function TenantProvider({ children }) {
  const [tenant, setTenant] = useState(getInitialTenant);
  const [loadingTenant, setLoadingTenant] = useState(() => !getInitialTenant());

  useEffect(() => {
    // Immediate title/favicon application from cached tenant
    if (tenant?.name) {
      document.title = `${tenant.name} | Modern Healthcare Portal`;
    }
    if (tenant?.logoUrl) {
      const existingFavicon = document.querySelector("link[rel*='icon']");
      if (existingFavicon) {
        existingFavicon.href = tenant.logoUrl;
      }
    }
  }, []);

  useEffect(() => {
    const bootstrapTenant = async () => {
      try {
        const origin = window.location.origin;
        // 1. Try primary endpoint /api/v2/partner?domain_eq={window.location.origin}
        let res;
        try {
          res = await api.get(`/api/v2/partner`, { params: { domain_eq: origin } });
        } catch {
          // Fallback endpoint /api/public/tenant?domain={window.location.origin}
          res = await api.get(`/api/public/tenant`, { params: { domain: origin } });
        }

        if (res && res.data) {
          setTenant(res.data);
          try {
            localStorage.setItem(`hc_tenant_${window.location.host}`, JSON.stringify(res.data));
          } catch {}
          // Set page title and favicon if provided
          if (res.data.name) {
            document.title = `${res.data.name} | Modern Healthcare Portal`;
          }
          if (res.data.logoUrl) {
            const existingFavicon = document.querySelector("link[rel*='icon']");
            if (existingFavicon) {
              existingFavicon.href = res.data.logoUrl;
            }
          }
        }
      } catch (err) {
        // Fallback default platform state
        setTenant({
          tenantType: "PLATFORM",
          name: "HealthConnect",
          code: "HC",
          webUrl: window.location.origin,
          about: "Minimalist Modern Healthcare & Specialist Consultations",
          razorpayKeyId: import.meta.env.VITE_RAZORPAY_KEY_ID || "rzp_test_51NxYzHCDefault",
          status: "ACTIVE",
          clinics: [],
        });
      } finally {
        setLoadingTenant(false);
      }
    };

    bootstrapTenant();
  }, []);

  return (
    <TenantContext.Provider value={{ tenant, setTenant, loadingTenant }}>
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  const context = useContext(TenantContext);
  if (!context) {
    return {
      tenant: {
        tenantType: "PLATFORM",
        name: "HealthConnect",
        code: "HC",
        razorpayKeyId: "rzp_test_51NxYzHCDefault",
        clinics: []
      },
      loadingTenant: false
    };
  }
  return context;
}

export default TenantContext;
