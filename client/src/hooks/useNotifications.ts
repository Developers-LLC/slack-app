import { useEffect, useRef, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

export function useNotifications() {
  const { user, isAuthenticated } = useAuth();
  const permissionRef = useRef<NotificationPermission>("default");
  const lastNotifiedRef = useRef<number>(0);

  // Request notification permission
  useEffect(() => {
    if (!isAuthenticated) return;
    if (!("Notification" in window)) return;

    if (Notification.permission === "default") {
      Notification.requestPermission().then(perm => {
        permissionRef.current = perm;
      });
    } else {
      permissionRef.current = Notification.permission;
    }
  }, [isAuthenticated]);

  const showNotification = useCallback((title: string, body: string, onClick?: () => void) => {
    if (permissionRef.current !== "granted") return;
    if (document.hasFocus()) return; // Don't notify if app is focused

    try {
      const notification = new Notification(title, {
        body,
        icon: "/favicon.ico",
        tag: `slack-${Date.now()}`,
        silent: false,
      });

      if (onClick) {
        notification.onclick = () => {
          window.focus();
          onClick();
          notification.close();
        };
      }

      // Auto-close after 5 seconds
      setTimeout(() => notification.close(), 5000);
    } catch (e) {
      // Notifications not supported in this context
    }
  }, []);

  return { showNotification, permissionGranted: permissionRef.current === "granted" };
}
