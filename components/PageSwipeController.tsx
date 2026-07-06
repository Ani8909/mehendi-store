import { useEffect } from "react";
import { useRouter } from "next/router";

export default function PageSwipeController() {
  const router = useRouter();

  useEffect(() => {
    // Enable swipe navigation on touch devices and mobile screens
    if (typeof window === "undefined") return;

    const tabs = ["/", "/packages", "/custom-package", "/services"];
    const currentIndex = tabs.indexOf(router.pathname);
    if (currentIndex === -1) return; // Only enable horizontal swipe between primary tabs

    let startX = 0;
    let startY = 0;
    let startTime = 0;

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return; // Ignore multi-touch/pinch
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      startTime = Date.now();
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!startX || !startY) return;
      const endX = e.changedTouches[0].clientX;
      const endY = e.changedTouches[0].clientY;
      const deltaX = endX - startX;
      const deltaY = endY - startY;
      const duration = Date.now() - startTime;

      // Validate horizontal swipe:
      // 1. Horizontal distance must exceed 75px
      // 2. Horizontal movement must be at least 2.5x greater than vertical (prevents accidental trigger when scrolling down/up)
      // 3. Must be a fast gesture (< 500ms)
      if (Math.abs(deltaX) > 75 && Math.abs(deltaX) > Math.abs(deltaY) * 2.5 && duration < 500) {
        // Prevent swipe if user is dragging inside a carousel, slider, or horizontal scrollable container
        const target = e.target as HTMLElement;
        if (
          target &&
          (target.closest(".overflow-x-auto") ||
            target.closest(".carousel") ||
            target.closest("[data-no-swipe]") ||
            target.closest("input, textarea, select"))
        ) {
          return;
        }

        if (deltaX < -75 && currentIndex < tabs.length - 1) {
          // Swipe Left -> Navigate to next tab
          router.push(tabs[currentIndex + 1]);
        } else if (deltaX > 75 && currentIndex > 0) {
          // Swipe Right -> Navigate to previous tab
          router.push(tabs[currentIndex - 1]);
        }
      }

      startX = 0;
      startY = 0;
    };

    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, [router.pathname]);

  return null;
}
