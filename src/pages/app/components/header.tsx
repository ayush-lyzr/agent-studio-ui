import { useState, useEffect } from "react";
import {
  ChevronDown,
  Coins,
  Info,
  LogOut,
  Monitor,
  Moon,
  Sun,
} from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { useManageAdminStore } from "@/pages/manage-admin/manage-admin.store";
import { useChatStore } from "../chat.store";
import { BrandLogo } from "@/components/branding/BrandLogo";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button, buttonVariants } from "@/components/ui/button";
import { convertToReadableNumber } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Path } from "@/lib/types";
import { CREDITS_DIVISOR, PlanType } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { CreditsHelperModal } from "@/components/sidebar/components/credits-helper-modal";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/custom/layout";
import { useOrganization } from "@/pages/organization/org.service";
import useStore from "@/lib/store";

const getAvatarFallback = (email?: string) => {
  return email?.[0]?.[0] ?? "";
};
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export function SiteHeader() {
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const usage_data = useManageAdminStore((state) => state.usage_data);
  const setUsageData = useManageAdminStore((state) => state.setUsageData);
  const current_organization = useManageAdminStore(
    (state) => state.current_organization,
  );
  const user = useManageAdminStore((state) => state.current_user);
  const agent = useChatStore((state) => state.agent);
  const token = useStore((state) => state.app_token);
  const [creditsHelperVisible, setCreditsHelperVisible] =
    useState<boolean>(false);

  const { getUsage } = useOrganization({ token, current_organization });

  useEffect(() => {
    const fetchUsageData = async () => {
      if (
        (!usage_data || Object.keys(usage_data).length === 0) &&
        current_organization?.org_id &&
        token
      ) {
        try {
          const res = await getUsage();
          setUsageData(res.data);
        } catch (error) {
          console.error("Error fetching usage data in header:", error);
        }
      }
    };

    fetchUsageData();
  }, [current_organization?.org_id, token]);

  const totalCredits =
    Number((usage_data?.paid_credits ?? 0).toFixed(2)) +
    Number((usage_data?.used_credits ?? 0).toFixed(2)) +
    Number((usage_data?.recurring_credits ?? 0).toFixed(2));

  const creditsLeft = totalCredits - Number(usage_data?.used_credits ?? 0);

  const onLogout = () => {
    try {
      logout();
      navigate(Path.LOGIN);
    } catch (error) {
      toast.error("Unable to Logout, please try after sometimes");
    }
  };

  return (
    <Layout.Header className="sticky top-0 flex w-full items-center justify-between bg-background md:px-2">
      {agent?.agent_id ? (
        <div className="flex w-full items-center gap-2 px-4">
          <BrandLogo className="h-8 w-auto object-contain" />
          <span>
            <p className="font-semibold">{agent?.name}</p>
            <p className="text-xs text-muted-foreground">by {agent?.creator}</p>
          </span>
        </div>
      ) : (
        <span className="flex items-center gap-2 px-4">
          <BrandLogo className="h-8 w-auto object-contain" />
        </span>
      )}
      <div className="flex items-center gap-4">
        <DropdownMenu>
          <DropdownMenuTrigger
            className={buttonVariants({ variant: "outline" })}
          >
            <Coins className="mr-1 size-4" />
            {convertToReadableNumber((creditsLeft / CREDITS_DIVISOR))} credits
          </DropdownMenuTrigger>

          <DropdownMenuContent className="relative flex w-60 flex-col space-y-2 rounded-lg p-4 text-sm shadow-md dark:bg-sidebar-accent">
            <p>Credits Summary</p>
            <div className="flex justify-between">
              <p className="text-muted-foreground">Total Credits</p>
              <p className="font-medium">
                {convertToReadableNumber(Math.round(totalCredits / CREDITS_DIVISOR))}
              </p>
            </div>
            <div className="flex justify-between">
              <p className="text-muted-foreground">Used Credits</p>
              <p className="font-medium">
                {convertToReadableNumber(Number(usage_data?.used_credits ?? 0) / CREDITS_DIVISOR)}
              </p>
            </div>
            <DropdownMenuSeparator />
            <div className="flex justify-between">
              <p className="text-muted-foreground">Credits Left</p>
              <p className="font-medium">
                {convertToReadableNumber(creditsLeft / CREDITS_DIVISOR)}
              </p>
            </div>
            <Button
              variant="link"
              size="sm"
              onClick={() => setCreditsHelperVisible(true)}
            >
              <Info className="mr-1 size-4" />
              How this works ?
            </Button>
          </DropdownMenuContent>
        </DropdownMenu>
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-1 rounded-lg p-2">
            <Avatar className="size-9 rounded-sm">
              <AvatarImage
                className="rounded-md"
                alt={user?.profileImage}
                src={user?.profileImage}
              />
              <AvatarFallback className="rounded-sm border border-border bg-background font-bold uppercase text-primary">
                {getAvatarFallback(user?.auth?.email)}
              </AvatarFallback>
            </Avatar>
            <span className="ml-1 flex h-9 w-28 flex-col items-start gap-1 text-sm font-bold">
              <p className="w-full truncate text-nowrap text-left text-xs">
                {user?.auth?.email}
              </p>
              <Badge variant="secondary" className="items-start px-1 py-0">
                <p className="line-clamp-1 text-left text-xxs">
                  {usage_data?.plan_name ?? PlanType.Community}
                </p>
              </Badge>
            </span>
            <ChevronDown className="size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent className="relative right-2 w-56">
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              {usage_data?.plan_name ?? PlanType.Community} plan
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div className="py-2">
              <Tabs
                defaultValue={theme}
                onValueChange={(value) => setTheme(value as typeof theme)}
              >
                <TabsList className="w-full">
                  <TabsTrigger value="light" className="w-1/3">
                    <Tooltip>
                      <TooltipTrigger>
                        <Sun className="size-4" />
                      </TooltipTrigger>
                      <TooltipContent>Light</TooltipContent>
                    </Tooltip>
                  </TabsTrigger>
                  <TabsTrigger value="dark" className="w-1/3">
                    <Tooltip>
                      <TooltipTrigger>
                        <Moon className="size-4 fill-primary" />
                      </TooltipTrigger>
                      <TooltipContent>Dark</TooltipContent>
                    </Tooltip>
                  </TabsTrigger>
                  <TabsTrigger value="system" className="w-1/3">
                    <Tooltip>
                      <TooltipTrigger>
                        <Monitor className="size-4" />
                      </TooltipTrigger>
                      <TooltipContent>System</TooltipContent>
                    </Tooltip>
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            <DropdownMenuItem onClick={onLogout}>
              <LogOut className="mr-1 size-4 text-destructive" />
              <p className="text-destructive hover:text-destructive/80">
                Logout
              </p>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <CreditsHelperModal
        open={creditsHelperVisible}
        onOpen={setCreditsHelperVisible}
      />
    </Layout.Header>
  );
}
