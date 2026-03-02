import Dashboard from "./analytics/dashboard";
import BillingCycle from "./billing-cycle";
import { memo } from "react";

const AnalyticsTab = memo(() => {
  return (
    <div className="">
      <BillingCycle />
      <Dashboard />
    </div>
  );
});

AnalyticsTab.displayName = "AnalyticsTab";

export default AnalyticsTab;
