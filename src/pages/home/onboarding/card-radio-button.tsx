import React, { Dispatch, ReactNode, SetStateAction } from "react";
import { ControllerRenderProps, FieldValues } from "react-hook-form";
import {
  BadgeDollarSign,
  BotMessageSquare,
  Briefcase,
  Code,
  Cog,
  Cookie,
  Ellipsis,
  Globe,
  Info,
  Linkedin,
  Newspaper,
  User,
  UserRoundCog,
  Users2,
  Youtube,
  Hammer,
  Telescope,
  ArrowRight,
} from "lucide-react";
import { z } from "zod";

import { Card, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { IOnboardingQuestion } from "@/lib/types";
import { RadioGroup } from "@/components/ui/radio-group";
import { Button } from "@/components/custom/button";

type IProps = {
  finish: boolean;
  isSaving: boolean;
  setFinish: Dispatch<SetStateAction<boolean>>;
  onNext: () => void;
  field: ControllerRenderProps<FieldValues, string>;
  onSubmit: (values: z.infer<z.ZodType<any, z.ZodTypeDef, any>>) => void;
};

const iconMap: { [key: string]: ReactNode } = {
  Work: <Briefcase />,
  "Build Agents": <Hammer className="size-9 group-hover:text-primary" />,
  "Explore Agents": <Telescope className="size-9 group-hover:text-primary" />,
  Friends: <Users2 className="size-9 group-hover:text-primary" />,
  Article: <Newspaper className="size-9 group-hover:text-primary" />,
  Internet: <Globe className="size-9 group-hover:text-primary" />,
  Youtube: <Youtube className="size-9 group-hover:text-primary" />,
  Linkedin: <Linkedin className="size-9 group-hover:text-primary" />,
  "Don't Remember": <Info className="size-9 group-hover:text-primary" />,
  Other: <Ellipsis className="size-9 group-hover:text-primary" />,
  "Personal Use": <User className="size-9 group-hover:text-primary" />,
  "Customer Support": (
    <BotMessageSquare className="size-9 group-hover:text-primary" />
  ),
  "Sales Agents": <Cookie className="size-9 group-hover:text-primary" />,
  "Content & Marketing Agents": (
    <Cookie className="size-9 group-hover:text-primary" />
  ),
  "Work Automation & Productivity": (
    <Cog className="size-9 group-hover:text-primary" />
  ),
  "Banking & Financial Agents": (
    <BadgeDollarSign className="size-9 group-hover:text-primary" />
  ),
  HR: <UserRoundCog className="size-9 group-hover:text-primary" />,
  "Developer/Engineering": <Code className="size-9 group-hover:text-primary" />,
  "Business User (Design, Sales, HR, etc.)": (
    <Briefcase className="size-9 group-hover:text-primary" />
  ),
};

const CardRadioButton: React.FC<IProps & Partial<IOnboardingQuestion>> = ({
  onNext,
  question,
  type,
  finish,
  setFinish,
  multiple,
  field,
  options,
  onSubmit,
  isSaving,
}) => {
  if (type === "dropdown") {
    return (
      <div className="grid gap-4">
        <Select
          value={field.value}
          onValueChange={(value) => {
            if (question === "Additional Details" && !!value) {
              setFinish(true);
            }
            field.onChange(value);
          }}
        >
          <SelectTrigger className="w-1/2">
            <SelectValue placeholder="Select Role" />
          </SelectTrigger>
          <SelectContent>
            {options?.map((opt) => (
              <SelectItem value={opt.label}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {finish && (
          <Button
            className="w-fit"
            size="sm"
            onClick={onSubmit}
            loading={isSaving}
          >
            Get started <ArrowRight className="ml-1 size-4" />
          </Button>
        )}
      </div>
    );
  }

  if (type === "radio") {
    return (
      <RadioGroup
        value={field.value}
        className={cn(
          "grid gap-4",
          `grid-cols-${options?.length && options?.length > 4 ? 4 : 2}`,
        )}
      >
        {options?.map((opt) => (
          <Card
            className={cn(
              "group flex cursor-pointer flex-col justify-between border-input/50",
              field.value === opt.label &&
                "border-primary bg-card-foreground/10",
            )}
            onClick={() => {
              field.onChange(opt.label);
              if (question === "What best describes you?") {
                if (opt.label === "Developer/Engineering") {
                  setFinish(true);
                }
                if (opt.label === "Business User (Design, Sales, HR, etc.)") {
                  onNext();
                }
              } else {
                onNext();
              }
            }}
          >
            <CardHeader>
              <CardTitle className="font-normal group-hover:text-primary">
                {opt.label}
              </CardTitle>
            </CardHeader>
            <CardFooter>{iconMap[opt.label]}</CardFooter>
          </Card>
        ))}
        {finish && (
          <Button
            className="col-span-2 w-fit"
            size="sm"
            onClick={onSubmit}
            loading={isSaving}
          >
            Get started <ArrowRight className="ml-1 size-4" />
          </Button>
        )}
      </RadioGroup>
    );
  }

  if (type === "checkbox") {
    return (
      <div
        className={cn(
          "grid gap-4",
          `grid-cols-${options?.length && options?.length > 4 ? 4 : 2}`,
        )}
      >
        {options?.map((opt) => (
          <Card
            className={cn(
              "group flex cursor-pointer flex-col justify-between",
              (field.value ?? []).includes(opt.label) &&
                "border-primary bg-card-foreground/10",
            )}
            onClick={() => {
              field.onChange(
                field.value?.includes(opt.label)
                  ? [...(field.value ?? [])].filter((o) => o !== opt.label)
                  : [...(field.value ?? []), opt.label],
              );
            }}
          >
            <CardHeader>
              <CardTitle className="font-normal group-hover:text-primary">
                {opt.label}
              </CardTitle>
            </CardHeader>
            <CardFooter>{iconMap[opt.label]}</CardFooter>
          </Card>
        ))}
        {multiple && (
          <Button
            className="w-fit transition-all ease-in"
            onClick={onNext}
            disabled={!(field?.value ?? [])?.length}
          >
            Continue
          </Button>
        )}
      </div>
    );
  }

  return null;
};

export default CardRadioButton;
