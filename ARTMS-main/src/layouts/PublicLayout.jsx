import { useEffect, useRef, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import ScrollToTop from "../components/ScrollToTop";

// Pages that have a dark navy hero — start with a navy background to
// prevent the white flash between route changes.
const DARK_HERO_ROUTES = ["/", "/application-guide", "/jobs"];

export default function PublicLayout() {
  const location = useLocation();
  const [visible, setVisible] = useState(false);
  const [displayedKey, setDisplayedKey] = useState(location.key);
  const prevPathRef = useRef(location.pathname);

  // Determine the bg colour to use during the transition.
  // If the *incoming* page has a dark hero, we use navy so the screen
  // never flashes white before the hero renders.
  const isDarkRoute = DARK_HERO_ROUTES.some(
    (r) => r === location.pathname || location.pathname.startsWith(r + "/")
  );
  const transitionBg = isDarkRoute ? "#060F5A" : "#F8FAFC";

  useEffect(() => {
    if (location.key === displayedKey) {
      // First mount — just fade in without a flicker.
      const raf = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(raf);
    }

    // Route changed: fade out, swap content, fade in.
    setVisible(false);
    prevPathRef.current = location.pathname;

    const swapTimer = setTimeout(() => {
      setDisplayedKey(location.key);
      // Allow one paint with the new content before fading in.
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setVisible(true));
      });
    }, 180); // matches the CSS transition duration below

    return () => clearTimeout(swapTimer);
  }, [location.key]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div
      className="flex min-h-screen flex-col"
      style={{ backgroundColor: transitionBg }}
    >
      <ScrollToTop />
      <Navbar />
      <main
        className="flex-1"
        style={{
          opacity: visible ? 1 : 0,
          transition: "opacity 220ms ease",
          willChange: "opacity",
        }}
      >
        {/* Keep the outlet keyed to displayedKey so React only swaps
            after the fade-out completes — avoids the white flash */}
        <Outlet key={displayedKey} />
      </main>
      <Footer />
    </div>
  );
}