import { useLocation } from "react-router-dom";

export default function useCheckActiveNav() {
  const { pathname } = useLocation();

  const checkActiveNav = (nav: string) => {
    // Special case for root path
    if (nav === "/") return pathname === "/";

    // Special case for agent pages
    if (nav === "/agent-builder" || nav === "/agent-create") {
      return (
        pathname.startsWith("/agent-builder") ||
        pathname.startsWith("/agent-create")
      );
    }

    const cleanNav = nav.replace(/^\//, "");
    const pattern = new RegExp(`^/${cleanNav}(?:/|$)`);
    return pattern.test(pathname);
  };

  return { checkActiveNav };
}
