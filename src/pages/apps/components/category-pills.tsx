import { cn } from "@/lib/utils";

interface CategoryPillProps {
    categories: string[];
    selectedCategory: string;
    onCategorySelect: (category: string) => void;
}

const categoryConfig: Record<string, { label: string }> = {
    hr: { label: "HR" },
    "core-utility": { label: "Core Utility" },
    sales: { label: "Sales" },
    banking: { label: "Banking & Insurance" },
    marketing: { label: "Marketing" },
    "customer-service": { label: "Customer Service" },
    "research-analysis": { label: "Research & Analysis" },
    "itops-secops": { label: "IT Ops & Security" },
};

export function CategoryPills({
    categories,
    selectedCategory,
    onCategorySelect,
}: CategoryPillProps) {
    return (
        <div className="flex flex-wrap items-center justify-center gap-2">
            {categories.map((category) => {
                const config = categoryConfig[category] || { label: category };
                const isSelected = selectedCategory === category;

                return (
                    <button
                        key={category}
                        onClick={() => onCategorySelect(category)}
                        className={cn(
                            "rounded-full px-4 py-2 text-sm font-medium transition-all duration-200",
                            isSelected
                                ? "bg-foreground text-background shadow-md"
                                : "bg-secondary text-foreground hover:bg-secondary/80"
                        )}
                    >
                        {config.label}
                    </button>
                );
            })}
        </div>
    );
}
