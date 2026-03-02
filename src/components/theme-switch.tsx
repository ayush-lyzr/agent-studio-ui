import { useEffect } from "react";
import { SunMoon } from "lucide-react";

import { useTheme } from "./theme-provider";
import { Button } from "./custom/button";

export default function ThemeSwitch({ isCollapsed }: { isCollapsed: boolean }) {
  const { theme, setTheme } = useTheme();

  const isLightTheme = theme === "light";

  const toggleTheme = () => setTheme(isLightTheme ? "dark" : "light");

  /* Update theme-color meta tag
   * when theme is updated */
  useEffect(() => {
    const themeColor = isLightTheme ? "#fff" : "#020817";
    const metaThemeColor = document.querySelector("meta[name='theme-color']");
    metaThemeColor && metaThemeColor.setAttribute("content", themeColor);
  }, [theme]);

  if (isCollapsed) {
    return (
      <div className="flex items-center justify-center py-2">
        <Button variant={"ghost"} size="icon" onClick={toggleTheme}>
          <SunMoon size={20} />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-2 px-7 py-2">
      <Button
        variant={"ghost"}
        size={isCollapsed ? "icon" : "default"}
        onClick={toggleTheme}
      >
        <SunMoon size={20} className="mr-1" />
        Toggle theme
      </Button>
    </div>
  );
}
