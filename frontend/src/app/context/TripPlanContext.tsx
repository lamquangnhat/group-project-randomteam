import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";

const TRIP_ACTIVITIES_STORAGE_KEY = "travelPlanner.tripActivities";

export interface Destination {
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

export interface TripActivity {
  id: number;
  name: string;
  category: string;
  date: string;
  time: string;
  cost: number | null;
  location: string;
  notes: string;
  duration: string;
}

interface TripPlanContextType {
  tripActivities: TripActivity[];
  addDestinationToTrip: (destination: Destination) => void;
  updateActivity: (id: number, updates: Partial<TripActivity>) => void;
  removeActivity: (id: number) => void;
  moveActivity: (id: number, direction: "up" | "down") => void;
  clearTrip: () => void;
}

const TripPlanContext = createContext<TripPlanContextType | undefined>(undefined);

function getTodayDate() {
  return new Date().toISOString().split("T")[0];
}

function loadSavedActivities(): TripActivity[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const savedActivities = window.localStorage.getItem(TRIP_ACTIVITIES_STORAGE_KEY);
    if (!savedActivities) {
      return [];
    }

    const parsedActivities = JSON.parse(savedActivities);
    if (!Array.isArray(parsedActivities)) {
      return [];
    }

    return parsedActivities.map((activity: Partial<TripActivity>) => ({
      id: Number(activity.id ?? Date.now()),
      name: String(activity.name ?? "Untitled destination"),
      category: String(activity.category ?? "Activity"),
      date: String(activity.date ?? getTodayDate()),
      time: String(activity.time ?? "09:00"),
      cost: typeof activity.cost === "number" ? activity.cost : null,
      location: String(activity.location ?? ""),
      notes: String(activity.notes ?? ""),
      duration: String(activity.duration ?? "2 hours"),
    }));
  } catch (error) {
    console.error("Failed to load saved trip activities", error);
    return [];
  }
}

export function TripPlanProvider({ children }: { children: ReactNode }) {
  const [tripActivities, setTripActivities] = useState<TripActivity[]>(loadSavedActivities);
  const navigate = useNavigate();

  useEffect(() => {
    window.localStorage.setItem(TRIP_ACTIVITIES_STORAGE_KEY, JSON.stringify(tripActivities));
  }, [tripActivities]);

  const addDestinationToTrip = (destination: Destination) => {
    const alreadyAdded = tripActivities.some(
      (activity) => activity.name === destination.name && activity.location === destination.location
    );

    if (alreadyAdded) {
      toast.info(`${destination.name} is already in your trip plan.`, {
        action: {
          label: "View Plan",
          onClick: () => navigate("/planning"),
        },
      });
      return;
    }

    const newActivity: TripActivity = {
      id: Date.now(),
      name: destination.name,
      category: destination.category,
      date: getTodayDate(),
      time: "09:00",
      cost: null,
      location: destination.location,
      notes: "",
      duration: "2 hours",
    };

    setTripActivities((prevActivities) => [...prevActivities, newActivity]);

    toast.success(`${destination.name} added to trip plan!`, {
      description: "Open the Plan Trip page to edit your itinerary.",
      action: {
        label: "View Plan",
        onClick: () => navigate("/planning"),
      },
    });
  };

  const updateActivity = (id: number, updates: Partial<TripActivity>) => {
    setTripActivities((prevActivities) =>
      prevActivities.map((activity) =>
        activity.id === id ? { ...activity, ...updates } : activity
      )
    );
  };

  const removeActivity = (id: number) => {
    setTripActivities((prevActivities) =>
      prevActivities.filter((activity) => activity.id !== id)
    );
  };

  const moveActivity = (id: number, direction: "up" | "down") => {
    setTripActivities((prevActivities) => {
      const currentIndex = prevActivities.findIndex((activity) => activity.id === id);
      if (currentIndex === -1) {
        return prevActivities;
      }

      const nextIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
      if (nextIndex < 0 || nextIndex >= prevActivities.length) {
        return prevActivities;
      }

      const reorderedActivities = [...prevActivities];
      [reorderedActivities[currentIndex], reorderedActivities[nextIndex]] = [
        reorderedActivities[nextIndex],
        reorderedActivities[currentIndex],
      ];

      return reorderedActivities;
    });
  };

  const clearTrip = () => {
    setTripActivities([]);
  };

  return (
    <TripPlanContext.Provider
      value={{
        tripActivities,
        addDestinationToTrip,
        updateActivity,
        removeActivity,
        moveActivity,
        clearTrip,
      }}
    >
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
