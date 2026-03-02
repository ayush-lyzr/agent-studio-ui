import { Check } from "lucide-react";

interface WizardStepsProps {
  currentStep: 1 | 2 | 3;
}

export default function WizardSteps({ currentStep }: WizardStepsProps) {
  const steps = [
    { number: 1, title: "Choose Source", description: "Select upload type" },
    { number: 2, title: "Configure", description: "Set up options" },
    { number: 3, title: "Upload", description: "Review & upload" },
  ];

  return (
    <div className="flex w-full items-center justify-between py-4">
      {steps.map((step, index) => {
        const isCompleted = currentStep > step.number;
        const isCurrent = currentStep === step.number;

        return (
          <div key={step.number} className="flex flex-1 items-center">
            {/* Step Circle */}
            <div className="flex flex-col items-center">
              <div
                className={`
                  flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all
                  ${
                    isCompleted
                      ? "border-primary bg-primary text-primary-foreground"
                      : isCurrent
                        ? "border-primary bg-background text-primary"
                        : "border-muted bg-background text-muted-foreground"
                  }
                `}
              >
                {isCompleted ? (
                  <Check className="h-5 w-5" />
                ) : (
                  <span className="text-sm font-medium">{step.number}</span>
                )}
              </div>
              <div className="mt-2 text-center">
                <div
                  className={`text-sm font-medium ${
                    isCurrent || isCompleted
                      ? "text-foreground"
                      : "text-muted-foreground"
                  }`}
                >
                  {step.title}
                </div>
                <div className="text-xs text-muted-foreground">
                  {step.description}
                </div>
              </div>
            </div>

            {/* Connecting Line */}
            {index < steps.length - 1 && (
              <div
                className={`
                  mx-4 h-0.5 flex-1 transition-all
                  ${currentStep > step.number ? "bg-primary" : "bg-muted"}
                `}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
