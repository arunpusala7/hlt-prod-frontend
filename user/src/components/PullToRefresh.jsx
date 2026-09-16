import React, { useState, useEffect, useRef } from "react";

export default function PullToRefresh({ onRefresh, children, pullThreshold = 65 }) {
  const [pullY, setPullY] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isReadyToRefresh, setIsReadyToRefresh] = useState(false);
  const [refreshSuccess, setRefreshSuccess] = useState(false);

  // Persistent gesture tracking refs that never get wiped during renders
  const startYRef = useRef(0);
  const startXRef = useRef(0);
  const isDraggingRef = useRef(false);
  const isRefreshingRef = useRef(false);
  const currentPullRef = useRef(0);
  const onRefreshRef = useRef(onRefresh);

  useEffect(() => {
    onRefreshRef.current = onRefresh;
  }, [onRefresh]);

  useEffect(() => {
    const getScrollTop = () => {
      return (
        window.pageYOffset ||
        document.documentElement.scrollTop ||
        document.body.scrollTop ||
        0
      );
    };

    // --- TOUCH HANDLERS ---
    const handleTouchStart = (e) => {
      if (isRefreshingRef.current) return;
      if (getScrollTop() <= 4) {
        startYRef.current = e.touches[0].clientY;
        startXRef.current = e.touches[0].clientX;
        isDraggingRef.current = true;
        currentPullRef.current = 0;
      } else {
        isDraggingRef.current = false;
      }
    };

    const handleTouchMove = (e) => {
      if (!isDraggingRef.current || isRefreshingRef.current) return;

      const currentY = e.touches[0].clientY;
      const currentX = e.touches[0].clientX;
      const diffY = currentY - startYRef.current;
      const diffX = currentX - startXRef.current;

      // Cancel if user is scrolled down
      if (getScrollTop() > 5) {
        isDraggingRef.current = false;
        if (currentPullRef.current > 0) {
          currentPullRef.current = 0;
          setPullY(0);
          setIsReadyToRefresh(false);
        }
        return;
      }

      // If horizontal gesture is more prominent, let horizontal swipe work (e.g. tabs, category pills)
      if (Math.abs(diffX) > Math.abs(diffY) && diffY < 25) {
        return;
      }

      if (diffY > 0) {
        // Ergonomic spring damping
        const damped = Math.min(Math.pow(diffY, 0.8) * 1.5, 95);
        currentPullRef.current = damped;
        setPullY(damped);
        setIsReadyToRefresh(damped >= pullThreshold);

        if (e.cancelable && diffY > 8) {
          e.preventDefault();
        }
      } else {
        currentPullRef.current = 0;
        setPullY(0);
        setIsReadyToRefresh(false);
      }
    };

    const handleTouchEnd = async () => {
      if (!isDraggingRef.current || isRefreshingRef.current) return;
      isDraggingRef.current = false;

      const shouldTrigger = currentPullRef.current >= pullThreshold;
      currentPullRef.current = 0;

      if (shouldTrigger) {
        isRefreshingRef.current = true;
        setIsRefreshing(true);
        setPullY(54);

        try {
          if (onRefreshRef.current) {
            await onRefreshRef.current();
          } else {
            await new Promise((resolve) => setTimeout(resolve, 500));
            window.location.reload();
            return;
          }
          setRefreshSuccess(true);
          await new Promise((res) => setTimeout(res, 500));
        } catch (err) {
          console.error("Pull to refresh error:", err);
        } finally {
          isRefreshingRef.current = false;
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

    // --- MOUSE HANDLERS (for desktop / laptop touchpad & mouse testing) ---
    const handleMouseDown = (e) => {
      if (isRefreshingRef.current || e.button !== 0) return;
      if (getScrollTop() <= 4) {
        startYRef.current = e.clientY;
        startXRef.current = e.clientX;
        isDraggingRef.current = true;
        currentPullRef.current = 0;
      }
    };

    const handleMouseMove = (e) => {
      if (!isDraggingRef.current || isRefreshingRef.current) return;

      const diffY = e.clientY - startYRef.current;
      if (getScrollTop() > 5) {
        isDraggingRef.current = false;
        setPullY(0);
        setIsReadyToRefresh(false);
        return;
      }

      if (diffY > 0) {
        const damped = Math.min(Math.pow(diffY, 0.8) * 1.5, 95);
        currentPullRef.current = damped;
        setPullY(damped);
        setIsReadyToRefresh(damped >= pullThreshold);
      } else {
        currentPullRef.current = 0;
        setPullY(0);
        setIsReadyToRefresh(false);
      }
    };

    const handleMouseUp = () => {
      if (isDraggingRef.current) {
        handleTouchEnd();
      }
    };

    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: false });
    window.addEventListener("touchend", handleTouchEnd, { passive: true });

    window.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);

      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [pullThreshold]);

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
          transform: `translateX(-50%) translateY(${pullY > 0 || isRefreshing ? Math.min(pullY, 65) : -80}px)`,
          transition:
            isRefreshing || pullY === 0
              ? "transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.2s ease"
              : "none",
          zIndex: 99999,
          pointerEvents: "none",
          opacity: pullY > 8 || isRefreshing ? 1 : 0,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            backgroundColor: "#FFFFFF",
            padding: "8px 18px",
            borderRadius: "9999px",
            boxShadow:
              "0 12px 28px -4px rgba(15, 23, 42, 0.18), 0 4px 10px -2px rgba(15, 23, 42, 0.08)",
            border: "1px solid #E2E8F0",
            color: isReadyToRefresh || isRefreshing ? "#2563EB" : "#475569",
            fontWeight: "600",
            fontSize: "13px",
          }}
        >
          {refreshSuccess ? (
            <>
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#16A34A"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
              <span style={{ color: "#16A34A" }}>Refreshed!</span>
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
              <span>Refreshing page...</span>
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
                  transition: "transform 0.12s ease",
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
          transform: isRefreshing ? "translateY(50px)" : pullY > 0 ? `translateY(${pullY * 0.38}px)` : undefined,
          transition: isRefreshing || pullY === 0 ? "transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)" : undefined,
          willChange: pullY > 0 || isRefreshing ? "transform" : undefined,
        }}
      >
        {children}
      </div>
    </div>
  );
}
