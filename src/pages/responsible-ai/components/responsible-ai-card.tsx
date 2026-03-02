import { useNavigate } from "react-router-dom";
import { Ellipsis, Pencil, Trash2 } from "lucide-react";

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { IRAIPolicy, Path } from "@/lib/types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type IResponsibleAiCard = {
  policy: Partial<IRAIPolicy>;
  onEdit: (data: Partial<IRAIPolicy>) => (e: any) => void;
  onDelete: (data: Partial<IRAIPolicy>) => (e: any) => void;
};

const ResponsibleAiCard: React.FC<IResponsibleAiCard> = ({
  policy,
  onEdit,
  onDelete,
}) => {
  const navigate = useNavigate();

  return (
    <Card
      className="h-36 cursor-pointer border transition-all hover:border-primary"
      onClick={() => navigate(`${Path.RESPONSIBLE_AI}/${policy?._id}`)}
    >
      <CardHeader>
        <div className="flex justify-between">
          <CardTitle className="text-base font-semibold">
            {policy?.name}
          </CardTitle>
          <DropdownMenu>
            <DropdownMenuTrigger>
              <div className="rounded-full p-1 hover:bg-gray-100 dark:hover:bg-gray-700">
                <Ellipsis className="size-4" />
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={onEdit(policy)}>
                <Pencil className="mr-2 size-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive hover:text-destructive/80"
                onClick={onDelete(policy)}
              >
                <Trash2 className="mr-2 size-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <CardDescription>{policy?.description}</CardDescription>
      </CardHeader>
    </Card>
  );
};

export default ResponsibleAiCard;
