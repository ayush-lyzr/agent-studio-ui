import { createBrowserRouter, RouterProvider } from "react-router-dom";
import GeneralError from "./pages/errors/general-error";
import NotFoundError from "./pages/errors/not-found-error";
import MaintenanceError from "./pages/errors/maintenance-error";
import UnauthorisedError from "./pages/errors/unauthorised-error.tsx";
import { isDevEnv, IS_ENTERPRISE_DEPLOYMENT } from "./lib/constants.ts";

const AppRouter = () => {
  const router = createBrowserRouter([
    {
      path: "/auth",
      lazy: async () => {
        const Authentication = await import("./pages/auth");
        return { Component: Authentication.default };
      },
      errorElement: <GeneralError />,
      children: [
        // Auth routes
        {
          path: "sign-in",
          lazy: async () => ({
            Component: (
              await import("./pages/auth/components/user-auth-form.tsx")
            ).default,
          }),
        },
        {
          path: "chat",
          lazy: async () => ({
            Component: (await import("./pages/chat-app")).default,
          }),
        },
        {
          path: "app/:app_id",
          lazy: async () => ({
            Component: (await import("./pages/app")).default,
          }),
        },
        {
          path: "sign-in-2",
          lazy: async () => ({
            Component: (await import("./pages/auth/sign-in-2")).default,
          }),
        },
        {
          path: "sign-up",
          lazy: async () => ({
            Component: (
              await import("./pages/auth/components/sign-up-form.tsx")
            ).default,
          }),
        },
        {
          path: "otp",
          lazy: async () => ({
            Component: (await import("./pages/auth/otp")).default,
          }),
        },
        {
          path: "callback",
          lazy: async () => ({
            Component: (await import("./pages/auth/callback")).default,
          }),
        },
      ],
    },
    {
      path: "forgot-password",
      lazy: async () => ({
        Component: (await import("./pages/auth/forgot-password")).default,
      }),
    },
    {
      path: "reset-password",
      lazy: async () => ({
        Component: (await import("./pages/auth/reset-password")).default,
      }),
    },
    {
      path: "verify-email",
      lazy: async () => ({
        Component: (await import("./pages/auth/verify-email")).default,
      }),
    },

    // Public blueprint viewer (no authentication required)
    {
      path: "/blueprint",
      lazy: async () => ({
        Component: (await import("./pages/blueprint-viewer")).default,
      }),
    },

    // Main routes
    {
      path: "/",
      lazy: async () => {
        // Conditionally load app-shell based on deployment type
        const AppShell = IS_ENTERPRISE_DEPLOYMENT
          ? await import("./components/app-shell-v2")
          : await import("./components/app-shell");
        return { Component: AppShell.default };
      },

      errorElement: <GeneralError />,
      children: [
        {
          index: true,
          lazy: async () => ({
            Component: (await import("./pages/home")).default,
          }),
        },
        {
          path: "onboarding",
          lazy: async () => ({
            Component: (await import("@/pages/home/onboarding")).default,
          }),
        },
        {
          path: "agent/:app_id",
          lazy: async () => ({
            Component: (await import("@/pages/app")).default,
          }),
        },
        {
          path: "agent-chat/:app_id",
          lazy: async () => ({
            Component: (await import("@/pages/app/chat-a2a-agent.tsx")).default,
          }),
        },
        {
          path: "agent-builder",
          lazy: async () => ({
            Component: (await import("@/pages/agent-builder")).default,
          }),
        },
        {
          path: "voice-agent-builder",
          lazy: async () => ({
            Component: (await import("@/pages/voice-agent-builder")).default,
          }),
        },
        {
          path: "agent-builder/ide",
          lazy: async () => ({
            Component: (
              await import("@/pages/agent-builder/components/ide.tsx")
            ).default,
          }),
        },
        {
          path: "agent-create",
          lazy: async () => ({
            Component: (
              await import("@/pages/create-agent/index-optimized.tsx")
            ).default,
          }),
        },
        {
          path: "/agent-create/:agentId",
          lazy: async () => ({
            Component: (
              await import("@/pages/create-agent/index-optimized.tsx")
            ).default,
          }),
        },
        {
          path: "voice-agent-create",
          lazy: async () => ({
            Component: (
              await import("@/pages/voice-agent-create/index-optimized.tsx")
            ).default,
          }),
        },
        ...(isDevEnv && !IS_ENTERPRISE_DEPLOYMENT
          ? [
              {
                path: "voice-new",
                lazy: async () => ({
                  Component: (await import("@/pages/voice-new")).default,
                }),
              },
              {
                path: "voice-new/session/:sessionId",
                lazy: async () => ({
                  Component: (
                    await import(
                      "@/pages/voice-new/transcripts/session-detail-page"
                    )
                  ).default,
                }),
              },
              {
                path: "voice-new-create",
                lazy: async () => ({
                  Component: (await import("@/pages/voice-new-create")).default,
                }),
              },
              {
                path: "voice-new-create/:agentId",
                lazy: async () => ({
                  Component: (await import("@/pages/voice-new-create")).default,
                }),
              },
            ]
          : []),
        {
          path: "/voice-agent-create/:agentId",
          lazy: async () => ({
            Component: (
              await import("@/pages/voice-agent-create/index-optimized.tsx")
            ).default,
          }),
        },
        {
          path: "account",
          lazy: async () => ({
            Component: (await import("@/pages/account")).default,
          }),
        },
        {
          path: "organization",
          lazy: async () => ({
            Component: (await import("@/pages/organization")).default,
          }),
        },
        {
          path: "upgrade-plan",
          lazy: async () => ({
            Component: (await import("@/pages/upgrade-plan")).default,
          }),
        },

        {
          path: "multi-agent-workflow",
          children: [
            {
              index: true,
              lazy: async () => ({
                Component: (
                  await import(
                    "@/pages/workflow-builder/components/WorkflowDashboard"
                  )
                ).default,
              }),
            },
            {
              path: "new",
              lazy: async () => ({
                Component: (
                  await import(
                    "@/pages/workflow-builder/components/WorkflowBuilder"
                  )
                ).default,
              }),
            },
            {
              path: ":workflowName",
              lazy: async () => ({
                Component: (
                  await import(
                    "@/pages/workflow-builder/components/WorkflowBuilder"
                  )
                ).default,
              }),
            },
          ],
        },
        {
          path: "manage",
          lazy: async () => ({
            Component: (await import("@/pages/manage-admin")).default,
          }),
        },
        {
          path: "multi-agent-workflow",
          children: [
            {
              index: true,
              lazy: async () => ({
                Component: (
                  await import(
                    "@/pages/workflow-builder/components/WorkflowDashboard"
                  )
                ).default,
              }),
            },
            {
              path: "new",
              lazy: async () => ({
                Component: (
                  await import(
                    "@/pages/workflow-builder/components/WorkflowBuilder"
                  )
                ).default,
              }),
            },
            {
              path: ":workflowName",
              lazy: async () => ({
                Component: (
                  await import(
                    "@/pages/workflow-builder/components/WorkflowBuilder"
                  )
                ).default,
              }),
            },
          ],
        },
        {
          path: "traces-v1",
          lazy: async () => ({
            Component: (await import("@/pages/traces")).default,
          }),
        },
        {
          path: "audit-logs",
          lazy: async () => ({
            Component: (await import("@/pages/audit-logs")).default,
          }),
        },
        {
          path: "traces-v2",
          lazy: async () => ({
            Component: (await import("@/pages/traces-v2")).default,
          }),
        },
        {
          path: "traces/:traceId",
          lazy: async () => ({
            Component: (await import("@/pages/trace-view")).default,
          }),
        },
        {
          path: "traces-v2/:traceId",
          lazy: async () => ({
            Component: (await import("@/pages/trace-view-v2")).default,
          }),
        },
        ...(isDevEnv
          ? [
              {
                path: "agent-policies",
                lazy: async () => ({
                  Component: (await import("@/pages/agent-policies")).default,
                }),
              },
              {
                path: "agent-policies/create",
                lazy: async () => ({
                  Component: (
                    await import("@/pages/agent-policies/create-policy")
                  ).default,
                }),
              },
              {
                path: "groups",
                lazy: async () => ({
                  Component: (await import("@/pages/groups")).default,
                }),
              },
              {
                path: "groups/create",
                lazy: async () => ({
                  Component: (await import("@/pages/groups/create-group"))
                    .default,
                }),
              },
              {
                path: "voice-builder",
                lazy: async () => ({
                  Component: (await import("@/pages/voice-builder")).default,
                }),
              },
            ]
          : []),
        {
          path: "configure",
          children: [
            {
              path: "models",
              lazy: async () => ({
                Component: (await import("@/pages/configure/models")).default,
              }),
            },
            {
              path: "tools",
              lazy: async () => ({
                Component: (await import("@/pages/configure/tools")).default,
              }),
            },
            {
              path: "data-connectors",
              lazy: async () => ({
                Component: (await import("@/pages/configure/data-connectors"))
                  .default,
              }),
            },
            {
              path: "memory",
              lazy: async () => ({
                Component: (await import("@/pages/configure/memory")).default,
              }),
            },
            {
              path: "guardrails",
              lazy: async () => ({
                Component: (await import("@/pages/configure/guardrails"))
                  .default,
              }),
            },
          ],
        },

        {
          path: "knowledge-base",
          lazy: async () => ({
            Component: (await import("@/pages/knowledge-base")).default,
          }),
        },
        {
          path: "global-contexts",
          lazy: async () => ({
            Component: (await import("@/pages/global-contexts")).default,
          }),
        },
        {
          path: "agent-marketplace",
          children: [
            {
              index: true,
              lazy: async () => ({
                Component: (await import("./pages/apps")).default,
              }),
            },
            {
              path: ":hubType",
              lazy: async () => ({
                Component: (
                  await import("./pages/apps/components/hub-page")
                ).default,
              }),
            },
            {
              path: ":hubType/:agentId",
              lazy: async () => ({
                Component: (await import("./pages/agent-hub")).default,
              }),
            },
          ],
        },
        {
          path: "agent-hub",
          lazy: async () => ({
            Component: (await import("@/pages/agent-hub")).default,
          }),
        },
        {
          path: "lyzr-manager",
          lazy: async () => ({
            Component: (await import("@/pages/orchestration/app")).default,
          }),
        },
        {
          path: "knowledge-base/:id",
          lazy: async () => ({
            Component: (await import("@/pages/knowledge-base-files")).default,
          }),
        },
        {
          path: "knowledge-base/semantic/:id",
          lazy: async () => ({
            Component: (await import("@/pages/knowledge-base-semantic"))
              .default,
          }),
        },
        {
          path: "credit-report",
          lazy: async () => ({
            Component: (await import("@/pages/credit-report")).default,
          }),
        },
        {
          path: "traces",
          lazy: async () => ({
            Component: (await import("@/pages/traces")).default,
          }),
        },
        {
          path: "responsible-ai",
          lazy: async () => ({
            Component: (await import("@/pages/responsible-ai")).default,
          }),
        },
        {
          path: "responsible-ai/:id",
          lazy: async () => ({
            Component: (await import("@/pages/responsible-ai/page")).default,
          }),
        },
        {
          path: "agent-eval",
          lazy: async () => ({
            Component: (await import("@/pages/agent-eval/pages/Index")).default,
          }),
        },
        {
          path: "agent-simulation-engine",
          lazy: async () => ({
            Component: (await import("@/pages/evals")).default,
          }),
        },
        {
          path: "agent-simulation-engine/world-model/:worldModelId",
          lazy: async () => ({
            Component: (await import("@/pages/evals/pages/WorldModelDetails"))
              .default,
          }),
        },
        {
          path: "ogi",
          lazy: async () => ({
            Component: (await import("@/pages/ogi")).default,
          }),
        },
        {
          path: "blueprints",
          lazy: async () => ({
            Component: (await import("@/pages/blueprints")).default,
          }),
        },
        {
          path: "executions",
          lazy: async () => ({
            Component: (await import("@/pages/executions")).default,
          }),
        },
        {
          path: "view-schedulers",
          lazy: async () => ({
            Component: (await import("@/pages/view-schedulers")).default,
          }),
        },
        {
          path: "product-roadmap",
          lazy: async () => ({
            Component: (
              await import("@/components/sidebar/components/product-roadmap")
            ).default,
          }),
        },
      ],
    },

    // Error routes
    { path: "/500", Component: GeneralError },
    { path: "/404", Component: NotFoundError },
    { path: "/503", Component: MaintenanceError },
    { path: "/401", Component: UnauthorisedError },

    // Fallback 404 route
    // { path: "*", Component: NotFoundError },
  ]);

  return <RouterProvider router={router} />;
};

export default AppRouter;
