import { cn } from "@/lib/utils";
import { pricingPlans } from "./data";
import { PricingTableProps } from "./types";
import { CheckCircle2, XCircle } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordian";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const PricingTable: React.FC<PricingTableProps> = ({ className }) => {
  const allFeatures =
    pricingPlans.length > 0 ? pricingPlans[0].features.map((f) => f.name) : [];

  const getFeatureValue = (planId: string, featureName: string) => {
    const plan = pricingPlans.find((p) => p.id === planId);
    const feature = plan?.features.find((f) => f.name === featureName);

    if (!feature) return "";

    if (typeof feature.value === "boolean") {
      return feature.value ? (
        <div className="grid place-items-center">
          <CheckCircle2 className="fill-success-background text-success" />
        </div>
      ) : (
        <div className="grid place-items-center">
          <XCircle className="fill-destructive/40 text-destructive" />
        </div>
      );
    }

    return feature.value;
  };
  return (
    <div className={cn("w-full", className)}>
      <div className="overflow-x-auto">
        <h3 className="mb-4 text-xl font-semibold">Plan Comparision</h3>
        <Table className="w-full table-fixed">
          <TableHeader>
            <TableRow>
              <TableHead className="w-[20%]"></TableHead>
              {pricingPlans.map((plan) => (
                <TableHead className="w-[20%] text-center">
                  {plan.name}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
        </Table>
        <Accordion
          type="multiple"
          defaultValue={["monthly", "yearly"]}
          className="w-full"
        >
          <AccordionItem
            value="monthly"
            className="border-b border-gray-200 last:border-b-0"
          >
            <AccordionTrigger className="bg-secondary p-4 text-left font-semibold transition-colors">
              Monthly
            </AccordionTrigger>
            <AccordionContent className="p-0" innerClassName="p-0">
              <Table className="w-full table-fixed border-b">
                <TableBody>
                  <TableRow className="text-muted-foreground transition-colors hover:bg-background">
                    <TableCell className="p-2">Price</TableCell>
                    <TableCell className="p-2 text-center">0$</TableCell>
                    <TableCell className="p-2 text-center">19$</TableCell>
                    <TableCell className="p-2 text-center">99$</TableCell>
                    <TableCell className="p-2 text-center">Custom</TableCell>
                  </TableRow>
                  <TableRow className="text-muted-foreground transition-colors hover:bg-background">
                    <TableCell className="p-2">Credits</TableCell>
                    <TableCell className="p-2 text-center">5/month</TableCell>
                    <TableCell className="p-2 text-center">
                      20/month
                    </TableCell>
                    <TableCell className="p-2 text-center">
                      100/month
                    </TableCell>
                    <TableCell className="p-2 text-center">Custom</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem
            value="yearly"
            className="border-b border-gray-200 last:border-b-0"
          >
            <AccordionTrigger className="bg-secondary p-4 text-left font-semibold transition-colors">
              Yearly
            </AccordionTrigger>
            <AccordionContent className="p-0" innerClassName="p-0">
              <Table className="w-full table-fixed border-b">
                <TableBody>
                  <TableRow className="text-muted-foreground transition-colors hover:bg-background">
                    <TableCell className="p-2 text-gray-600">Price</TableCell>
                    <TableCell className="p-2 text-center">0$</TableCell>
                    <TableCell className="p-2 text-center">
                      Not available
                    </TableCell>
                    <TableCell className="p-2 text-center">79$/month</TableCell>
                    <TableCell className="p-2 text-center">Custom</TableCell>
                  </TableRow>
                  <TableRow className="text-muted-foreground transition-colors hover:bg-background">
                    <TableCell className="p-2 text-gray-600">Credits</TableCell>
                    <TableCell className="p-2 text-center">5/month</TableCell>
                    <TableCell className="p-2 text-center">
                      Not available
                    </TableCell>
                    <TableCell className="p-2 text-center">
                      1200/yearly
                    </TableCell>
                    <TableCell className="p-2 text-center">Custom</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
        <h3 className="my-4 text-xl font-semibold">Features</h3>
        <Table className="w-full table-fixed border-b">
          <TableBody>
            {allFeatures.map((featureName) => (
              <TableRow key={featureName}>
                <TableCell className="p-2 text-left text-gray-700">
                  {featureName}
                </TableCell>
                {pricingPlans.map((plan) => (
                  <TableCell
                    key={`${plan.id}-${featureName}`}
                    className="p-2 text-center text-gray-600"
                  >
                    {getFeatureValue(plan.id, featureName)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
