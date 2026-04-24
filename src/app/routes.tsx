import { createBrowserRouter } from "react-router";
import { LandingPage } from "./pages/LandingPage";
import { HomePage } from "./pages/HomePage";
import { PlanningPage } from "./pages/PlanningPage";
import { AIAssistancePage } from "./pages/AIAssistancePage";
import { RootLayout } from "./layouts/RootLayout";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <LandingPage />,
  },
  {
    element: <RootLayout />,
    children: [
      {
        path: "/home",
        element: <HomePage />,
      },
      {
        path: "/planning",
        element: <PlanningPage />,
      },
      {
        path: "/ai-assistant",
        element: <AIAssistancePage />,
      },
    ],
  },
]);
