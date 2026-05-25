import { useLayoutEffect } from "react";
import { useLocation } from "react-router-dom";

/** Always open new routes from the top (fixes scroll-to-bottom on navigation). */
const ScrollToTop = () => {
  const { pathname } = useLocation();

  useLayoutEffect(() => {
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [pathname]);

  return null;
};

export default ScrollToTop;
