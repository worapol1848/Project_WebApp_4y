// code in this file is written by worapol สุดหล่อ
import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export default function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    // Ensure the browser doesn't try to restore scroll position automatically - by worapol สุดหล่อ
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
  }, []);

  useEffect(() => {
    // Scroll to the very top immediately when route changes - by worapol สุดหล่อ
    window.scrollTo(0, 0);
    // Also scroll document elements just in case overflow is handled there - by worapol สุดหล่อ
    document.body.scrollTo(0, 0);
    document.documentElement.scrollTo(0, 0);
  }, [pathname]);

  return null;
}
