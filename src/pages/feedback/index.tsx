// import React, { useEffect } from "react";
// import axios from "axios";
// import { MemberstackCurrentUser } from "@/lib/types";
// import { useToast } from "@/components/ui/use-toast";

// const FeaturebaseFeedback: React.FC<{
//   currentUser?: Partial<MemberstackCurrentUser>;
//   theme: string;
// }> = ({ currentUser, theme }) => {
//   const { toast } = useToast();

//   useEffect(() => {
//     const loadFeaturebase = async () => {
//       if (!currentUser?.auth?.email) return;

//       const user = {
//         email: currentUser.auth.email,
//         name:
//           currentUser.customFields?.["first-name"]
//             ? `${currentUser.customFields["first-name"]} ${currentUser.customFields["last-name"] ?? ""}`
//             : currentUser.auth.email,
//         userId: currentUser.id,
//         organization: "lyzr",
//       };

//       try {
//         // Fetch the JWT token from your backend
//         const response = await axios.post(
//           `${import.meta.env.VITE_BASE_URL}/api/featurebase-token/`,
//           user,
//           {
//             headers: {
//               "Content-Type": "application/json",
//             },
//           }
//         );
//         const jwtToken = response.data.token;
//         const win = window as any;

//         const initializeFeaturebase = () => {
//           if (typeof win.Featurebase !== "function") {
//             win.Featurebase = function () {
//               (win.Featurebase.q = win.Featurebase.q || []).push(arguments);
//             };
//           }

//           // Authenticate securely via 'identify'
//           win.Featurebase(
//             "identify",
//             {
//               organization: "lyzr",
//               email: user.email,
//               name: user.name,
//               id: user.userId,
//               jwtToken,
//               locale: "en",
//             },
//             (err: any) => {
//               if (err) {
//                 console.error("Featurebase identify failed:", err);
//               }
//             }
//           );

//           // Initialize the widget (token now managed internally)
//           win.Featurebase(
//             "initialize_feedback_widget",
//             {
//               organization: "lyzr",
//               theme,
//               defaultBoard: "Feature Request",
//               locale: "en",
//             },
//             (_: any, callback: any) => {
//               if (callback?.action === "feedbackSubmitted") {
//                 toast({
//                   title: "Success",
//                   description: "Your feedback/bug has been reported!",
//                 });
//               }
//             }
//           );
//         };

//         // Inject Featurebase SDK script once
//         if (!document.getElementById("featurebase-sdk")) {
//           const script = document.createElement("script");
//           script.src = `${import.meta.env.VITE_BASE_URL}/api/featurebase/sdk.js/`;
//           script.id = "featurebase-sdk";
//           script.async = true;
//           script.onload = initializeFeaturebase;
//           document.body.appendChild(script);
//         } else {
//           initializeFeaturebase();
//         }
//       } catch (error) {
//         console.error("Failed to fetch Featurebase token:", error);
//       }
//     };

//     loadFeaturebase();
//   }, [currentUser?.auth?.email, theme]);

//   return null;
// };

// export default FeaturebaseFeedback;
