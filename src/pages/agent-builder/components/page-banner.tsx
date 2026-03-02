import { Link } from "react-router-dom";
import mixpanel from "mixpanel-browser";
import { MoveUpRight } from "lucide-react";

import { PageTitle } from "@/components/ui/page-title";
import { isMixpanelActive } from "@/lib/constants";

export const PageBanner = () => {
  return (
    <div className="flex items-center justify-between">
      <PageTitle
        title="Agents"
        description={
          <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
            <p>Create and manage your agents.</p>
            <Link
              to="https://www.avanade.com/en-gb/services"
              target="_blank"
              className="flex items-center text-link underline-offset-4 hover:underline"
              onClick={() => {
                if (mixpanel.hasOwnProperty("cookie") && isMixpanelActive)
                  mixpanel.track("Docs-clicked", {
                    feature: "Agents Listing",
                  });
              }}
            >
              Docs
              <MoveUpRight className="ml-1 size-3" />
            </Link>
            <Link
              to="https://www.avanade.com/en-gb/services"
              target="_blank"
              className="ml-2 flex items-center text-link underline-offset-4 hover:underline"
              onClick={() => {
                if (mixpanel.hasOwnProperty("cookie") && isMixpanelActive)
                  mixpanel.track("API-clicked", {
                    feature: "Agents Listing",
                  });
              }}
            >
              API
              <MoveUpRight className="ml-1 size-3" />
            </Link>
          </span>
        }
      />
      {/* <Link to="https://pypi.org/project/lyzr-mcp-tool-call/" target="_blank">
        <div
          className="flex items-center gap-2 rounded-md border p-1"
          onClick={trackMCPClick}
        >
          <Badge>New</Badge>
          <p className="text-sm">
            Use your Lyzr agents as tools in any MCP-compatible client and
            interact with them directly
          </p>
          <ChevronRight className="size-4" />
        </div>
      </Link> */}
    </div>
  );
};
