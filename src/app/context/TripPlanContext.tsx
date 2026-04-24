import { createContext, useContext, useState, ReactNode } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";

interface Destination {
  id: number;
  name: string;
  category: string;
  image: string;
  rating: number;
  reviews: number;
  location: string;
  price: string;
  description: string;
  fullDescription: string;
  features: string[];
  hours: string;
}

interface TripActivity {
  id: number;
  name: string;
  category: string;
  date: string;
  time: string;
  cost: number | null;
  bookable: boolean;
  location: string;
}

interface TripPlanContextType {
  tripActivities: TripActivity[];
  addDestinationToTrip: (destination: Destination) => void;
  removeActivity: (id: number) => void;
}

const TripPlanContext = createContext<TripPlanContextType | undefined>(undefined);

export function TripPlanProvider({ children }: { children: ReactNode }) {
  const [tripActivities, setTripActivities] = useState<TripActivity[]>([]);
  const navigate = useNavigate();

  const addDestinationToTrip = (destination: Destination) => {
    const newActivity: TripActivity = {
      id: Date.now(),
      name: destination.name,
      category: destination.category,
      date: new Date().toISOString().split('T')[0],
      time: "09:00",
      cost: null,
      bookable: true,
      location: destination.location
    };

    setTripActivities(prev => [...prev, newActivity]);

    toast.success(`${destination.name} added to trip plan!`, {
      description: "Visit the Planning page to manage your itinerary",
      action: {
        label: "View Plan",
        onClick: () => navigate("/planning")
      }
    });
  };

  const removeActivity = (id: number) => {
    setTripActivities(prev => prev.filter(activity => activity.id !== id));
  };

  return (
    <TripPlanContext.Provider value={{ tripActivities, addDestinationToTrip, removeActivity }}>
      {children}
    </TripPlanContext.Provider>
  );
}

export function useTripPlan() {
  const context = useContext(TripPlanContext);
  if (context === undefined) {
    throw new Error("useTripPlan must be used within a TripPlanProvider");
  }
  return context;
}
