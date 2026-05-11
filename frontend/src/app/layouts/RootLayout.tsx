import { Outlet } from "react-router";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";
import { TripPlanProvider } from "../context/TripPlanContext";
import { Toaster } from "../components/ui/sonner";

export function RootLayout() {
  return (
    <TripPlanProvider>
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1">
          <Outlet />
        </main>
        <Footer />
        <Toaster />
      </div>
    </TripPlanProvider>
  );
}
