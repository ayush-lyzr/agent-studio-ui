import {
  House,
  BotMessageSquare,
  Database,
  BrainCircuit,
  Wrench,
  Store,
  Unplug,
  Mic2,
  HardDrive,
} from "lucide-react";

export interface NavLink {
  title: string;
  label?: string;
  href: string;
  icon: JSX.Element;
}

export interface SideLink extends NavLink {
  sub?: NavLink[];
  separator?: boolean;
}

export const sidelinks: SideLink[] = [
  {
    title: "Home",
    label: "",
    href: "/",
    icon: <House size={22} />,
    separator: true,
  },
  {
    title: "Agent Builder",
    label: "",
    href: "/agent-builder",
    icon: <BotMessageSquare size={22} />,
  },
  {
    title: "Voice Builder",
    label: "",
    href: "/voice-builder",
    icon: <Mic2 size={22} />,
  },
  {
    title: "Knowledge Base",
    label: "",
    href: "/knowledge-base",
    icon: <Database size={22} />,
    separator: true,
  },
  {
    title: "Models",
    label: "",
    href: "/configure/models",
    icon: <BrainCircuit size={22} />,
  },
  {
    title: "Tools",
    label: "",
    href: "/configure/tools",
    icon: <Wrench size={22} />,
  },
  {
    title: "Agent Policies",
    label: "",
    href: "/agent-policies",
    icon: <BrainCircuit size={22} />,
  },
  {
    title: "Data Connectors",
    label: "",
    href: "/configure/data-connectors",
    icon: <Unplug size={22} />,
  },
  {
    title: "Memory",
    label: "",
    href: "/configure/memory",
    icon: <HardDrive size={22} />,
    separator: true,
  },
  {
    title: "Agent Marketplace",
    label: "",
    href: "/Agent Marketplace",
    icon: <Store size={22} />,
  },
];
