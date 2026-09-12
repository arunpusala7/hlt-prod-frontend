import React, { createContext, useContext, useState, useEffect } from "react";
import api from "../api/api";

const TenantContext = createContext(null);

export function TenantProvider({ children }) {
  const [tenant, setTenant] = useState(null);
  const [loadingTenant, setLoadingTenant] = useState(true);

  useEffect(() => {
    const bootstrapTenant = async () => {
      try {
        const isLocal =
          typeof window !== "undefined" &&
          (window.location.hostname === "localhost" ||
           window.location.hostname === "127.0.0.1");

        // Local testing override (?tenant=apollo.zuuuz.in) strictly scoped to local dev
        // Zero effect on production multi-tenancy!
        let localOverrideDomain = null;
        if (isLocal) {
          const urlParams = new URLSearchParams(window.location.search);
          const param = urlParams.get("tenant") || urlParams.get("domain");
          if (param) {
            if (param === "clear" || param === "default" || param === "reset") {
              localStorage.removeItem("hc_test_tenant_domain");
            } else {
              localStorage.setItem("hc_test_tenant_domain", param);
              localOverrideDomain = param;
            }
          } else {
            localOverrideDomain = localStorage.getItem("hc_test_tenant_domain");
          }
        }

        // Resolution:
        // Production: Always resolves by actual domain (window.location.hostname / origin)
        // Local Dev: If test param is provided, queries that tenant; otherwise uses window.location.origin
        const domainToResolve =
          (isLocal && localOverrideDomain)
            ? localOverrideDomain
            : (!isLocal ? window.location.hostname : window.location.origin);

        let res;
        try {
          res = await api.get(`/api/v2/partner`, { params: { domain_eq: domainToResolve } });
        } catch {
          res = await api.get(`/api/public/tenant`, { params: { domain: domainToResolve } });
        }

        if (res && res.data && (res.data.id || res.data.tenantType)) {
          setTenant(res.data);
          if (res.data.name) {
            document.title = `${res.data.name.trim()} | Modern Healthcare Portal`;
          }
          if (res.data.logoUrl) {
            const existingFavicon = document.querySelector("link[rel*='icon']");
            if (existingFavicon) {
              existingFavicon.href = res.data.logoUrl;
            }
          }
        } else {
          throw new Error("No tenant payload returned");
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
