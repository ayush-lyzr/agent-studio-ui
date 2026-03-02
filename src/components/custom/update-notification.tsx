// import React from "react";
// import { Button } from "@/components/ui/button";
// import { useToast } from "@/components/ui/use-toast";
// // import { useServiceWorkerUpdate } from "@/hooks/useServiceWorkerUpdate";

// export const UpdateNotification: React.FC = () => {
//   const { toast } = useToast();
//   const { updateAvailable, isUpdating, error, updateApp, dismissUpdate } =
//     useServiceWorkerUpdate();

//   // Show toast notification for updates
//   React.useEffect(() => {
//     if (updateAvailable) {
//       toast({
//         title: "Update Available",
//         description:
//           "A new version of the app is available. Would you like to update?",
//         action: (
//           <div className="flex gap-2">
//             <Button
//               size="sm"
//               variant="secondary"
//               onClick={updateApp}
//               disabled={isUpdating}
//             >
//               {isUpdating ? "Updating..." : "Update"}
//             </Button>
//             <Button size="sm" onClick={dismissUpdate} disabled={isUpdating}>
//               Later
//             </Button>
//           </div>
//         ),
//         duration: 10 * 1000, // Don't auto-dismiss
//       });
//     }
//   }, [updateAvailable, isUpdating, updateApp, dismissUpdate]);

//   // Show error notification
//   React.useEffect(() => {
//     if (error) {
//       toast({
//         title: "Update Error",
//         description: error,
//         variant: "destructive",
//         duration: 5000,
//       });
//     }
//   }, [error]);

//   return null; // This component only handles notifications
// };
