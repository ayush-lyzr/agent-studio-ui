// import { Link } from "react-router-dom";
// import mixpanel from "mixpanel-browser";
// import { MoveUpRight } from "lucide-react";

import { PageTitle } from "@/components/ui/page-title";
// import { isMixpanelActive } from "@/lib/constants";

export const PageBanner = () => {
  return (
    <div className="flex items-center justify-between">
      <PageTitle
        title="Voice"
        description={
          <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
            <p>Create and manage your voice agents.</p>
            {/* <Link
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
            </Link> */}
          </span>
        }
      />
    </div>
  );
};
