import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";

import { Button } from "@/components/ui/button";
import { lyzrApps } from "@/data/lyzr-apps";
import { UtilityBar } from "./utility-bar";
import { useDebounce } from "@/hooks/useDebounce";
import { LyzrAgentCard } from "./compact-agent-card";

const hubTitles: Record<string, string> = {
  "banking-insurance-hub": "Banking & Insurance Hub",
  "sales-hub": "Sales Hub",
  "research-analysis-hub": "Research & Analysis Hub",
  "marketing-hub": "Marketing Hub",
  "hr-hub": "HR Hub",
  "core-utility-hub": "Core & Utility Hub",
  "customer-service-hub": "Customer Support Hub",
  "itops-secops-hub": "IT Ops & Security Ops Hub",
};

// Map URL hub names to actual hub field values in lyzr-apps.ts
const hubNameMapping: Record<string, string> = {
  "banking-insurance": "banking-insurance",
  "sales": "sales",
  "research-analysis": "research-analysis",
  "marketing": "marketing",
  "hr": "hr",
  "core-utility": "core-utility",
  "customer-service": "customer-service",
  "itops-secops": "itops-secops",
};

export default function HubPage() {
  const { hubType } = useParams();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedIndustry, setSelectedIndustry] = useState<string>("");
  const [selectedFunction, setSelectedFunction] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const debouncedSearch = useDebounce<string>(searchTerm, 800);

  const hubName = hubType?.replace("-hub", "") || "";
  const actualHubValue = hubNameMapping[hubName] || hubName;
  
  // Filter by exact hub field value
  const filteredApps = lyzrApps
    .filter((app) => app.hub === actualHubValue)
    .filter((app) => {
      const matchesSearch = app.name
        .toLowerCase()
        .includes(debouncedSearch.toLowerCase());
      const matchesIndustry =
        !selectedIndustry || app.industry_tag === selectedIndustry;
      const matchesFunction =
        !selectedFunction || app.function_tag === selectedFunction;
      const matchesCategory =
        !selectedCategory || app.category_tag === selectedCategory;

      return (
        matchesSearch && matchesIndustry && matchesFunction && matchesCategory
      );
    });

  const clearFilters = () => {
    setSelectedIndustry("");
    setSelectedFunction("");
    setSelectedCategory("");
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -10 }}
      className="h-full w-full p-8"
    >
      <div className="mb-8 space-y-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="size-5" />
          </Button>
          <h1 className="text-2xl font-bold">{hubTitles[hubType || ""]}</h1>
        </div>

        <UtilityBar
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          selectedType="All Agents"
          setSelectedType={() => {}}
          selectedIndustry={selectedIndustry}
          selectedFunction={selectedFunction}
          selectedCategory={selectedCategory}
          setSelectedIndustry={setSelectedIndustry}
          setSelectedFunction={setSelectedFunction}
          setSelectedCategory={setSelectedCategory}
          clearFilters={clearFilters}
          hideTypeSelector
        />
      </div>

      <div className="grid grid-cols-4 gap-4">
        {filteredApps.map((app) => (
          <LyzrAgentCard
            key={app.id}
            app={{
              id: app.id,
              name: app.name,
              description: app.description,
              navigation_path: app.navigation_path,
              special: app.special,
              coming_soon: app.coming_soon,
              new: app.new,
              demo: app.demo,
              forProAnAbove: app.forProAnAbove,
              industry_tag: app.industry_tag,
              function_tag: app.function_tag,
              category_tag: app.category_tag,
            }}
          />
        ))}
      </div>
    </motion.div>
  );
}
