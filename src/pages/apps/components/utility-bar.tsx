import React, { Dispatch, SetStateAction, useMemo } from "react";
import { cn } from "@/lib/utils";
import { RefreshCw, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  INDUSTRY_OPTIONS,
  FUNCTION_OPTIONS,
  CATEGORY_OPTIONS,
} from "@/lib/constants";
import { useSearchParams } from "react-router-dom";

interface UtilityBarProps {
  searchTerm: string;
  setSearchTerm: Dispatch<SetStateAction<string>>;
  loading?: boolean;
  appType?: "all" | "connected" | "notConnected";
  refresh?: () => void;
  setAppType?: Dispatch<SetStateAction<"all" | "connected" | "notConnected">>;
  selectedIndustry: string;
  selectedFunction: string;
  selectedCategory: string;
  setSelectedIndustry: (value: string) => void;
  setSelectedFunction: (value: string) => void;
  setSelectedCategory: (value: string) => void;
  selectedType: string;
  setSelectedType: (value: string) => void;
  clearFilters: () => void;
  hideTypeSelector?: boolean;
}

export const UtilityBar: React.FC<UtilityBarProps> = ({
  loading,
  searchTerm,
  refresh,
  setSearchTerm,
  selectedIndustry,
  selectedFunction,
  selectedCategory,
  setSelectedIndustry,
  setSelectedFunction,
  setSelectedCategory,
  selectedType,
  setSelectedType,
  clearFilters,
  hideTypeSelector = false,
}) => {
  const [searchParams, setSearchParams] = useSearchParams();

  const updateUrlParams = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    setSearchParams(params);
  };

  const APP_TYPE_OPTIONS = useMemo(() => {
    return ["All Agents", "My Agents", "Community Agents"];
  }, []);

  const SearchInput = useMemo(
    () => (
      <span className="col-span-3 flex items-center rounded-md border border-input px-2">
        <Search className="size-5" />
        <Input
          placeholder="Search agents..."
          className="w-48 border-none bg-transparent shadow-none"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        {searchTerm?.length > 0 && (
          <X
            className="size-4 cursor-default duration-500 animate-in animate-out fade-out-0 slide-in-from-right-2"
            onClick={() => setSearchTerm("")}
          />
        )}
      </span>
    ),
    [searchTerm, setSearchTerm],
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex w-full items-center gap-4">
        {SearchInput}
        <Button variant="outline" onClick={refresh}>
          <RefreshCw className={cn("size-4", loading && "animate-spin")} />
        </Button>

        <Select
          value={selectedCategory}
          onValueChange={(value) => {
            setSelectedCategory(value);
            updateUrlParams("category", value);
          }}
        >
          <SelectTrigger
            className={cn(
              "w-[200px]",
              selectedCategory && "border-primary bg-primary/10",
            )}
          >
            <SelectValue placeholder="Select Category">
              {selectedCategory ? (
                <>
                  <span className="font-bold">Category:</span>{" "}
                  {selectedCategory}
                </>
              ) : (
                "Category"
              )}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {CATEGORY_OPTIONS.map((category) => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={selectedIndustry}
          onValueChange={(value) => {
            setSelectedIndustry(value);
            updateUrlParams("industry", value);
          }}
        >
          <SelectTrigger
            className={cn(
              "w-[200px]",
              selectedIndustry && "border-primary bg-primary/10",
            )}
          >
            <SelectValue placeholder="Select Industry">
              {selectedIndustry ? (
                <>
                  <span className="font-bold">Industry:</span>{" "}
                  {selectedIndustry}
                </>
              ) : (
                "Industry"
              )}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {INDUSTRY_OPTIONS.map((industry) => (
              <SelectItem key={industry} value={industry}>
                {industry}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={selectedFunction}
          onValueChange={(value) => {
            setSelectedFunction(value);
            updateUrlParams("function", value);
          }}
        >
          <SelectTrigger
            className={cn(
              "w-[200px]",
              selectedFunction && "border-primary bg-primary/10",
            )}
          >
            <SelectValue placeholder="Select Function">
              {selectedFunction ? (
                <>
                  <span className="font-bold">Function:</span>{" "}
                  {selectedFunction}
                </>
              ) : (
                "Function"
              )}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {FUNCTION_OPTIONS.map((func) => (
              <SelectItem key={func} value={func}>
                {func}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {(selectedIndustry || selectedFunction || selectedCategory) && (
          <Button
            variant="link"
            onClick={clearFilters}
            className="text-sm text-blue-500 transition-colors animate-in slide-in-from-left-2 hover:text-blue-700"
          >
            Clear filters
          </Button>
        )}

        {!hideTypeSelector && (
          <div className="ml-auto">
            <Select
              value={selectedType}
              onValueChange={(value) => {
                setSelectedType(value);
                updateUrlParams("type", value);
              }}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select Type" />
              </SelectTrigger>
              <SelectContent>
                {APP_TYPE_OPTIONS.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
    </div>
  );
};
