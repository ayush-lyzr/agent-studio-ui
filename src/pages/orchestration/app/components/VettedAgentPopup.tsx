import { motion, AnimatePresence } from "framer-motion";
import { X, ExternalLink, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface VettedAgentPopupProps {
  isVisible: boolean;
  onClose: () => void;
  blueprintName?: string;
  blueprintId?: string;
}

export default function VettedAgentPopup({
  isVisible,
  onClose,
  blueprintName = "",
  blueprintId = "",
}: VettedAgentPopupProps) {
  const handleFormClick = () => {
    // Create the prefilled Google Form URL
    const baseFormUrl =
      "https://docs.google.com/forms/d/e/1FAIpQLSf2_ceAF4iy5FBZE_RFVxfpeHEF-yBAEVcgVWdhVndHqxAk-g/viewform?usp=pp_url";
    const encodedBlueprintName = encodeURIComponent(
      blueprintName || "Unknown Blueprint",
    );
    const encodedBlueprintId = encodeURIComponent(blueprintId || "unknown-id");

    const prefillUrl = `${baseFormUrl}&entry.1231048088=${encodedBlueprintName}&entry.1481676400=${encodedBlueprintId}`;

    // Open in new tab
    window.open(prefillUrl, "_blank");
    onClose();
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, x: 100, y: 50 }}
          animate={{
            opacity: 1,
            x: 0,
            y: 0,
            transition: {
              type: "spring",
              duration: 0.6,
              bounce: 0.3,
            },
          }}
          exit={{
            opacity: 0,
            x: 100,
            y: 50,
            transition: { duration: 0.3 },
          }}
          className="fixed bottom-6 right-6 z-50 max-w-sm"
        >
          <div className="relative overflow-hidden rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-100 p-6 shadow-xl backdrop-blur-sm dark:border-blue-800 dark:from-blue-950 dark:to-indigo-950">
            {/* Close button */}

            <X
              className="absolute right-4 top-4 size-4 cursor-pointer text-gray-500 hover:text-gray-700"
              onClick={onClose}
            />

            {/* Animated sparkles */}
            <motion.div
              animate={{
                rotate: [0, 360],
                scale: [1, 1.1, 1],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="absolute -right-2 -top-2"
            >
              <Sparkles className="h-8 w-8 text-yellow-400" />
            </motion.div>

            {/* Content */}
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <motion.div
                  animate={{
                    scale: [1, 1.2, 1],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="flex-shrink-0"
                >
                  <div className="rounded-full bg-blue-500 p-2">
                    <Sparkles className="h-5 w-5 text-white" />
                  </div>
                </motion.div>

                <div className="flex-1 space-y-2">
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    Verified Blueprint
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    This is a verified blueprint created by Lyzr.
                  </p>
                </div>
              </div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="rounded-lg bg-white/50 p-3 dark:bg-gray-800/50"
              >
                <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">
                  Need help with this template?
                </p>
                <Button
                  onClick={handleFormClick}
                  className="w-full bg-blue-600 text-white hover:bg-blue-700"
                  size="sm"
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Get Support
                </Button>
              </motion.div>
            </div>

            {/* Animated background glow */}
            <motion.div
              animate={{
                opacity: [0.3, 0.6, 0.3],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="absolute inset-0 -z-10 bg-gradient-to-r from-blue-400/20 to-indigo-400/20 blur-xl"
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
