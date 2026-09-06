import React, { useState, useEffect, useRef } from "react";

export default function PullToRefresh({ onRefresh, children, pullThreshold = 70 }) {
  const [pullY, setPullY] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isReadyToRefresh, setIsReadyToRefresh] = useState(false);
  const [refreshSuccess, setRefreshSuccess] = useState(false);

  useEffect(() => {
    let startY = 0;
    let isTracking = false;

    const handleTouchStart = (e) => {
      if (window.scrollY <= 2 && !isRefreshing) {
        startY = e.touches[0].clientY;
        isTracking = true;
      } else {
        isTracking = false;
      }
    };

    const handleTouchMove = (e) => {
      if (!isTracking || isRefreshing) return;
      const currentY = e.touches[0].clientY;
      const diff = currentY - startY;

      if (diff > 0 && window.scrollY <= 0) {
        const damped = Math.min(Math.pow(diff, 0.82) * 1.4, 90);
        setPullY(damped);
        setIsReadyToRefresh(damped >= pullThreshold);

        if (e.cancelable && diff > 8) {
          e.preventDefault();
        }
      } else if (diff < 0) {
        setPullY(0);
        setIsReadyToRefresh(false);
      }
    };

    const handleTouchEnd = async () => {
      if (!isTracking || isRefreshing) return;
      isTracking = false;

      if (pullY >= pullThreshold) {
        setIsRefreshing(true);
        setPullY(54);

        try {
          if (onRefresh) {
            await Promise.all([
              onRefresh(),
              new Promise((res) => setTimeout(res, 600))
            ]);
          } else {
            await new Promise((res) => setTimeout(res, 600));
          }
          setRefreshSuccess(true);
          await new Promise((res) => setTimeout(res, 400));
        } catch (err) {
          console.error("Refresh error:", err);
        } finally {
          setIsRefreshing(false);
          setIsReadyToRefresh(false);
          setRefreshSuccess(false);
          setPullY(0);
        }
      } else {
        setPullY(0);
        setIsReadyToRefresh(false);
      }
    };

    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: false });
    window.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, [isRefreshing, pullY, pullThreshold, onRefresh]);

  const progress = Math.min(pullY / pullThreshold, 1);
  const rotationAngle = isRefreshing ? 0 : progress * 180;

  return (
    <div style={{ position: "relative", width: "100%", minHeight: "100%" }}>
      {/* Pull down indicator pill */}
      <div
        style={{
          position: "fixed",
          top: "16px",
          left: "50%",
          transform: `translateX(-50%) translateY(${pullY > 0 || isRefreshing ? Math.min(pullY, 65) : -70}px)`,
          transition: isRefreshing || pullY === 0 ? "transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.2s ease" : "none",
          zIndex: 9999,
          pointerEvents: "none",
          opacity: pullY > 10 || isRefreshing ? 1 : 0,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            backgroundColor: "#FFFFFF",
            padding: "8px 16px",
            borderRadius: "9999px",
            boxShadow: "0 10px 25px -4px rgba(15, 23, 42, 0.15), 0 4px 10px -2px rgba(15, 23, 42, 0.08)",
            border: "1px solid #E2E8F0",
            color: isReadyToRefresh || isRefreshing ? "#2563EB" : "#475569",
            fontWeight: "600",
            fontSize: "13px",
          }}
        >
          {refreshSuccess ? (
            <>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
              <span style={{ color: "#16A34A" }}>Updated!</span>
            </>
          ) : isRefreshing ? (
            <>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#2563EB"
                strokeWidth="2.5"
                style={{ animation: "ptr-spin 0.7s linear infinite" }}
              >
                <path d="M21 12a9 9 0 1 1-6.219-8.56"></path>
              </svg>
              <span>Refreshing...</span>
            </>
          ) : (
            <>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{
                  transform: `rotate(${rotationAngle}deg)`,
                  transition: "transform 0.15s ease",
                }}
              >
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <polyline points="19 12 12 19 5 12"></polyline>
              </svg>
              <span>{isReadyToRefresh ? "Release to refresh" : "Pull down to refresh"}</span>
            </>
          )}
        </div>
      </div>

      <style>{`
        @keyframes ptr-spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>

      {/* Content wrapper with smooth spring bounce during pull */}
      <div
        style={{
          transform: `translateY(${isRefreshing ? 48 : pullY > 0 ? pullY * 0.35 : 0}px)`,
          transition: isRefreshing || pullY === 0 ? "transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)" : "none",
          willChange: "transform",
        }}
      >
        {children}
      </div>
    </div>
  );
}
