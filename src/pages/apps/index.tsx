import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import mixpanel from "mixpanel-browser";

import { Layout } from "@/components/custom/layout";
import Apps from "./components/market-place-new";
import { isMixpanelActive } from "@/lib/constants";
import { useManageAdminStore } from "../manage-admin/manage-admin.store";

if (mixpanel.hasOwnProperty("cookie") && isMixpanelActive)
  mixpanel.track("Marketplace page visited");
export default function Dashboard() {
  const { getToken } = useAuth();
  const token = getToken() ?? "";
  const currentUser = useManageAdminStore((state) => state.current_user);
  const userId = currentUser?.id ?? "";

  return (
    <Layout>
      <Layout.Body className="overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="h-full w-full py-8"
        >
          <Apps currentUser={currentUser} userId={userId} token={token} />
        </motion.div>
      </Layout.Body>
    </Layout>
  );
}
