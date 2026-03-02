import { Link } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import { Button } from "./custom/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "./ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";
import { cn } from "@/lib/utils";
import useCheckActiveNav from "@/hooks/use-check-active-nav";
import { SideLink } from "@/data/sidelinks";
import { Separator } from "./ui/separator";

interface NavProps extends React.HTMLAttributes<HTMLDivElement> {
  isCollapsed: boolean;
  links: SideLink[];
  closeNav: () => void;
}

export default function Nav({
  links,
  isCollapsed,
  className,
  closeNav,
}: NavProps) {
  const renderLink = ({ sub, separator, ...rest }: SideLink) => {
    const key = `${rest.title}-${rest.href}`;
    return (
      <>
        {isCollapsed && sub ? (
          <NavLinkIconDropdown
            {...rest}
            sub={sub}
            key={key}
            closeNav={closeNav}
          />
        ) : isCollapsed ? (
          <NavLinkIcon {...rest} key={key} closeNav={closeNav} />
        ) : sub ? (
          <NavLinkDropdown {...rest} sub={sub} key={key} closeNav={closeNav} />
        ) : (
          <NavLink {...rest} key={key} closeNav={closeNav} />
        )}
        {separator && <Separator className="my-2" />}
      </>
    );
  };
  return (
    <div
      data-collapsed={isCollapsed}
      className={cn(
        "group border-b bg-background px-4 py-2 transition-[max-height,padding] duration-500 data-[collapsed=true]:py-4 md:border-none",
        className,
      )}
    >
      <TooltipProvider delayDuration={0}>
        <div className="space-y-2">{links.map(renderLink)}</div>
      </TooltipProvider>
    </div>
  );
}

interface NavLinkProps extends SideLink {
  subLink?: boolean;
  closeNav: () => void;
}

function NavLink({ title, icon, label, href, closeNav }: NavLinkProps) {
  const { checkActiveNav } = useCheckActiveNav();

  return (
    <Link
      to={href}
      onClick={closeNav}
      className={cn(
        "flex w-full items-center rounded-md text-sm font-medium text-slate-500 dark:text-slate-400",
        "px-2 py-1.5 hover:bg-slate-100 hover:text-foreground dark:hover:bg-slate-800 dark:hover:text-slate-200",
        checkActiveNav(href) &&
          "bg-slate-100 text-foreground dark:bg-slate-800 dark:text-slate-200",
      )}
      aria-current={checkActiveNav(href) ? "page" : undefined}
    >
      <div className="grid h-6 w-6 place-items-center">{icon}</div>
      <span className="ml-2">{title}</span>
      {label && (
        <div className="ml-auto rounded-md bg-primary px-1 text-[0.6rem] text-primary-foreground">
          {label}
        </div>
      )}
    </Link>
  );
}

function NavLinkDropdown({ title, icon, label, sub, closeNav }: NavLinkProps) {
  const { checkActiveNav } = useCheckActiveNav();

  /* Open collapsible by default
   * if one of child element is active */
  const isChildActive = !!sub?.find((s) => checkActiveNav(s.href));

  return (
    <Collapsible defaultOpen={isChildActive}>
      <CollapsibleTrigger className="group flex h-10 w-full justify-start rounded-none p-3 text-sm text-slate-500">
        <div className="mr-1.5">{icon}</div>
        {title}
        {label && (
          <div className="ml-1.5 rounded-md bg-primary px-1 text-[0.6rem] text-primary-foreground">
            {label}
          </div>
        )}
        <span
          className={cn(
            'ml-auto transition-all group-data-[state="open"]:-rotate-180',
          )}
        >
          <ChevronDown size={16} stroke="1.5" />
        </span>
      </CollapsibleTrigger>
      <CollapsibleContent className="collapsibleDropdown" asChild>
        <ul className="space-y-2">
          {sub!.map((sublink) => (
            <li key={sublink.title} className="ml-4">
              <NavLink {...sublink} subLink closeNav={closeNav} />
            </li>
          ))}
        </ul>
      </CollapsibleContent>
    </Collapsible>
  );
}

function NavLinkIcon({ title, icon, label, href, closeNav }: NavLinkProps) {
  const { checkActiveNav } = useCheckActiveNav();
  const isActive = checkActiveNav(href);

  return (
    <Tooltip delayDuration={0}>
      <TooltipTrigger asChild>
        <Link
          to={href}
          onClick={closeNav}
          className={cn(
            "grid h-9 w-9 place-items-center rounded-md text-sm font-medium text-slate-500 dark:text-slate-400",
            "hover:bg-slate-100 hover:text-foreground dark:hover:bg-slate-800 dark:hover:text-slate-200",
            isActive &&
              "bg-slate-100 text-foreground dark:bg-slate-800 dark:text-slate-200",
          )}
        >
          <div className="grid h-6 w-6 place-items-center">{icon}</div>
          <span className="sr-only">{title}</span>
        </Link>
      </TooltipTrigger>
      <TooltipContent side="right" className="flex items-center gap-3 text-xs">
        {title}
        {label && <span className="ml-auto">{label}</span>}
      </TooltipContent>
    </Tooltip>
  );
}

function NavLinkIconDropdown({ title, icon, label, sub }: NavLinkProps) {
  const { checkActiveNav } = useCheckActiveNav();
  const isChildActive = !!sub?.find((s) => checkActiveNav(s.href));

  return (
    <DropdownMenu>
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <Button
              variant={isChildActive ? "secondary" : "ghost"}
              size="icon"
              className={cn(
                "grid h-10 w-10 place-items-center rounded-md text-sm font-medium text-slate-500 dark:text-slate-400",
                "hover:bg-slate-100 hover:text-foreground dark:hover:bg-slate-800 dark:hover:text-slate-200",
                isChildActive && "text-foreground dark:text-slate-200",
              )}
            >
              {icon}
            </Button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent
          side="right"
          className="flex items-center gap-3 text-xs"
        >
          {title}
          {label && <span className="ml-auto">{label}</span>}
          <ChevronDown size={14} className="-rotate-90" />
        </TooltipContent>
      </Tooltip>
      <DropdownMenuContent
        side="right"
        align="start"
        sideOffset={4}
        className="text-sm"
      >
        <DropdownMenuLabel>
          {title} {label ? `(${label})` : ""}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {sub!.map(({ title, icon, label, href }) => (
          <DropdownMenuItem key={`${title}-${label}`} asChild>
            <Link
              to={href}
              className={cn(
                "flex w-full justify-start rounded-md px-3 py-1.5 text-sm font-medium text-slate-500 hover:bg-slate-100",
                checkActiveNav(href) && "bg-slate-100",
              )}
            >
              {icon} <span className="ml-1.5 max-w-48 text-wrap">{title}</span>
              {label && <span className="ml-auto text-[0.6rem]">{label}</span>}
            </Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
