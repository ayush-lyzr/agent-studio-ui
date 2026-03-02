import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronLeft } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

import { PageTitle } from "@/components/ui/page-title";
import { Button } from "@/components/ui/button";
import { CreateGroupForm } from "./components/create-group-form";
import { useGroups } from "./groups.service";
import { Path } from "@/lib/types";

export default function CreateGroupPage() {
  const navigate = useNavigate();
  const { getToken } = useAuth();
  const token = getToken() ?? "";
  const { createGroup, isCreatingGroup } = useGroups(token);

  const goBack = () => {
    navigate(Path.GROUPS);
  };

  const handleSuccess = () => {
    toast.success("Group created successfully");
    navigate(Path.GROUPS);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex h-full w-full flex-col space-y-8 p-8"
    >
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={goBack}
          className="mr-2 h-8 w-8"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <PageTitle
          title="Create Folder"
          description="Set up a new group for collaboration"
        />
      </div>

      <div className="grid max-w-3xl grid-cols-1 gap-8">
        <CreateGroupForm
          onSuccess={handleSuccess}
          onCancel={goBack}
          createGroup={createGroup}
          isCreatingGroup={isCreatingGroup}
        />
      </div>
    </motion.div>
  );
}
