import { Dispatch, ReactNode, SetStateAction } from "react";
import { Link } from "react-router-dom";

import {
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

type SidebarItem = {
  title: string;
  description?: string;
  url?: string;
  icon?: ReactNode;
  beta?: boolean;
  blocked?: boolean;
  new?: boolean;
  type?: string;
  onClick?: () => void;
  children?: SidebarItem[];
  external?: boolean; // Flag for external links
};

type AppSidebarItemProps = {
  item: SidebarItem;
  className?: string;
  open: boolean;
  setUpgradeVisible?: Dispatch<
    SetStateAction<{
      title: string;
      description: string;
      open: boolean;
    }>
  >;
};

export const AppSidebarItem = ({
  item,
  className,
  open,
  setUpgradeVisible,
}: AppSidebarItemProps) => {
  const isExternal = item.external;
  return (
    <SidebarMenuItem
      key={item.title}
      className={cn("flex w-full items-center justify-between", className)}
    >
      <SidebarMenuButton
        asChild
        size="xs"
        tooltip={item.title}
        isActive={!isExternal && location.pathname + location.search === item.url}
        onClick={() => {
          if (item.blocked && setUpgradeVisible) {
            setUpgradeVisible({
              title: item.title,
              description: item?.description ?? "",
              open: true,
            });
          }
        }}
      >
        {isExternal ? (
          <a
            href={!item.blocked ? item.url || "" : ""}
            target="_blank"
            rel="noopener noreferrer"
          >
            {item.icon} {open && item.title}{" "}
          </a>
        ) : (
          <Link to={!item.blocked ? item.url || "" : ""}>
            {item.icon} {open && item.title}{" "}
          </Link>
        )}
      </SidebarMenuButton>
      {(item.blocked || item?.new) && open && (
        <SidebarMenuBadge
          className="right-1"
          onClick={() => {
            if (item.blocked && setUpgradeVisible)
              setUpgradeVisible({
                title: item.title,
                description: item?.description ?? "",
                open: true,
              });
          }}
        >
          {item.blocked && (
            <span className="relative ml-2 rounded-full bg-premium-background px-2 py-0 text-xxs font-normal text-premium">
              Upgrade
            </span>
          )}
          {item?.new && (
            <span className="relative ml-2 rounded-lg bg-primary/10 px-2 py-0 text-xxs font-normal text-black dark:text-zinc-300">
              New
            </span>
          )}
        </SidebarMenuBadge>
      )}
    </SidebarMenuItem>
  );
};
