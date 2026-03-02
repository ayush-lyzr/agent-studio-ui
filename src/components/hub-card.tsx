import { useNavigate } from "react-router-dom";
import { Building2, LineChart, Search, Mail, ShieldUser } from "lucide-react";

import { Card, CardHeader, CardTitle } from "./ui/card";

interface HubCardProps {
  title: string;
  path: string;
  appCount: number;
  disabled?: boolean;
}

const hubStyles = {
  "Banking & Insurance Hub": {
    icon: Building2,
    // bg: "bg-blue-500/10 dark:bg-blue-500/20",
  },
  "Sales Hub": {
    icon: LineChart,
    // bg: "bg-green-500/10 dark:bg-green-500/20",
  },
  "Research & Analysis Hub": {
    icon: Search,
    // bg: "bg-purple-500/10 dark:bg-purple-500/20",
  },
  "Marketing Hub": {
    icon: Mail,
    // bg: "bg-orange-500/10 dark:bg-orange-500/20",
  },
  "HR Hub": {
    icon: ShieldUser,
    // bg: "bg-orange-500/10 dark:bg-orange-500/20",
  },
} as const;

export function HubCard({ title, path, appCount, disabled }: HubCardProps) {
  const navigate = useNavigate();
  const HubIcon = hubStyles[title as keyof typeof hubStyles]?.icon;
  // const bgColor = hubStyles[title as keyof typeof hubStyles]?.bg;

  return (
    <Card
      className={`relative cursor-pointer border transition-all hover:border-primary hover:bg-opacity-20 ${
        disabled ? "cursor-not-allowed opacity-50" : ""
      }`}
      onClick={() => !disabled && navigate(path)}
    >
      <CardHeader className="flex h-36 flex-col justify-between">
        <div className="flex justify-end">
          {HubIcon && <HubIcon className="h-6 w-6 text-foreground/80" />}
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base text-foreground">{title}</CardTitle>
          </div>
          <p className="text-sm text-foreground/70">
            {appCount} app{appCount > 1 ? "s" : ""}
          </p>
        </div>
      </CardHeader>
    </Card>
  );
}
