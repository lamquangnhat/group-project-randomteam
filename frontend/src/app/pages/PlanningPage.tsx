import { useEffect, useState } from "react";
import { Link } from "react-router";
import {
  ArrowDown,
  ArrowUp,
  Calendar,
  Check,
  ClipboardList,
  Copy,
  Download,
  MapPin,
  Plus,
  Printer,
  Save,
  Trash2,
  Users,
} from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";
import { useTripPlan } from "../context/TripPlanContext";

const TRIP_DETAILS_STORAGE_KEY = "travelPlanner.tripDetails";
const TRIP_CHECKLIST_STORAGE_KEY = "travelPlanner.tripChecklist";

interface TripDetails {
  title: string;
  startDate: string;
  endDate: string;
  travelers: number;
  budget: number;
}

interface ChecklistItem {
  id: number;
  text: string;
  done: boolean;
}

const defaultTripDetails: TripDetails = {
  title: "My Trip Plan",
  startDate: new Date().toISOString().split("T")[0],
  endDate: "",
  travelers: 1,
  budget: 0,
};

const defaultChecklist: ChecklistItem[] = [
  { id: 1, text: "Confirm travel dates", done: false },
  { id: 2, text: "Book transport", done: false },
  { id: 3, text: "Reserve accommodation", done: false },
  { id: 4, text: "Prepare documents", done: false },
  { id: 5, text: "Pack essentials", done: false },
];

function readLocalStorage<T>(key: string, fallbackValue: T): T {
  if (typeof window === "undefined") {
    return fallbackValue;
  }

  try {
    const savedValue = window.localStorage.getItem(key);
    return savedValue ? (JSON.parse(savedValue) as T) : fallbackValue;
  } catch (error) {
    console.error(`Failed to read ${key} from localStorage`, error);
    return fallbackValue;
  }
}

function formatMoney(amount: number) {
  return amount.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

function getTripDays(startDate: string, endDate: string) {
  if (!startDate || !endDate) {
    return 1;
  }

  const start = new Date(startDate);
  const end = new Date(endDate);
  const difference = end.getTime() - start.getTime();

  if (Number.isNaN(difference) || difference < 0) {
    return 1;
  }

  return Math.floor(difference / 86_400_000) + 1;
}

export function PlanningPage() {
  const {
    tripActivities,
    updateActivity,
    removeActivity,
    moveActivity,
    clearTrip,
  } = useTripPlan();

  const [tripDetails, setTripDetails] = useState<TripDetails>(() =>
    readLocalStorage(TRIP_DETAILS_STORAGE_KEY, defaultTripDetails)
  );
  const [checklist, setChecklist] = useState<ChecklistItem[]>(() =>
    readLocalStorage(TRIP_CHECKLIST_STORAGE_KEY, defaultChecklist)
  );
  const [newChecklistItem, setNewChecklistItem] = useState("");

  useEffect(() => {
    window.localStorage.setItem(TRIP_DETAILS_STORAGE_KEY, JSON.stringify(tripDetails));
  }, [tripDetails]);

  useEffect(() => {
    window.localStorage.setItem(TRIP_CHECKLIST_STORAGE_KEY, JSON.stringify(checklist));
  }, [checklist]);

  const totalCost = tripActivities.reduce(
    (sum, activity) => sum + (activity.cost ?? 0),
    0
  );
  const completedChecklistItems = checklist.filter((item) => item.done).length;
  const tripDays = getTripDays(tripDetails.startDate, tripDetails.endDate);
  const remainingBudget = tripDetails.budget - totalCost;
  const budgetUsedPercent = tripDetails.budget
    ? Math.min(100, Math.round((totalCost / tripDetails.budget) * 100))
    : 0;

  const updateTripDetail = <K extends keyof TripDetails>(
    key: K,
    value: TripDetails[K]
  ) => {
    setTripDetails((currentDetails) => ({ ...currentDetails, [key]: value }));
  };

  const addChecklistItem = () => {
    const trimmedItem = newChecklistItem.trim();
    if (!trimmedItem) {
      return;
    }

    setChecklist((currentItems) => [
      ...currentItems,
      { id: Date.now(), text: trimmedItem, done: false },
    ]);
    setNewChecklistItem("");
  };

  const createPlanSummary = () => {
    const itinerary = tripActivities
      .map((activity, index) => {
        const costText = activity.cost === null ? "Cost not set" : formatMoney(activity.cost);
        const notesText = activity.notes ? `\n   Notes: ${activity.notes}` : "";
        return `${index + 1}. ${activity.date} ${activity.time} - ${activity.name} (${activity.category})\n   Location: ${activity.location}\n   Duration: ${activity.duration}\n   Estimated cost: ${costText}${notesText}`;
      })
      .join("\n\n");

    const checklistText = checklist
      .map((item) => `${item.done ? "[x]" : "[ ]"} ${item.text}`)
      .join("\n");

    return `${tripDetails.title}\nDates: ${tripDetails.startDate || "Not set"} to ${tripDetails.endDate || "Not set"}\nTravelers: ${tripDetails.travelers}\nBudget: ${tripDetails.budget ? formatMoney(tripDetails.budget) : "Not set"}\nEstimated total: ${formatMoney(totalCost)}\n\nItinerary\n${itinerary || "No destinations added yet."}\n\nChecklist\n${checklistText || "No checklist items."}`;
  };

  const savePlan = () => {
    window.localStorage.setItem(TRIP_DETAILS_STORAGE_KEY, JSON.stringify(tripDetails));
    window.localStorage.setItem(TRIP_CHECKLIST_STORAGE_KEY, JSON.stringify(checklist));
    toast.success("Trip plan saved in this browser.");
  };

  const copyPlan = async () => {
    const summary = createPlanSummary();

    try {
      await navigator.clipboard.writeText(summary);
      toast.success("Trip summary copied to clipboard.");
    } catch (error) {
      console.error("Failed to copy plan", error);
      toast.error("Could not copy automatically. Please use Export instead.");
    }
  };

  const exportPlan = () => {
    const blob = new Blob([createPlanSummary()], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${tripDetails.title || "trip-plan"}.txt`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const resetPlan = () => {
    clearTrip();
    setTripDetails(defaultTripDetails);
    setChecklist(defaultChecklist);
    window.localStorage.removeItem(TRIP_DETAILS_STORAGE_KEY);
    window.localStorage.removeItem(TRIP_CHECKLIST_STORAGE_KEY);
    toast.success("Trip plan cleared.");
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="relative overflow-hidden bg-[radial-gradient(circle_at_18%_22%,#45e6b0_0%,transparent_26%),radial-gradient(circle_at_86%_8%,#6bbdff_0%,transparent_25%),linear-gradient(135deg,#071827_0%,#173a58_52%,#0f6170_100%)] py-16 text-white print:hidden">
        <div className="absolute -left-24 top-8 h-72 w-72 rounded-full bg-emerald-300/20 blur-3xl" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center"
          >
            <div>
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-emerald-50 shadow-lg backdrop-blur">
                <ClipboardList className="h-4 w-4 text-emerald-300" />
                Organize every stop in one plan
              </div>
              <h1 className="text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
                Plan Your Perfect Trip
              </h1>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-100/90">
                Build an itinerary, track budget, save your checklist, and export your plan without a backend.
              </p>
            </div>

            <div className="grid gap-3 rounded-[2rem] border border-white/15 bg-white/10 p-4 shadow-2xl shadow-black/20 backdrop-blur sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
              <div className="rounded-2xl bg-white/12 p-4 ring-1 ring-white/15">
                <Calendar className="mb-3 h-5 w-5 text-emerald-300" />
                <p className="text-3xl font-black">{tripDays}</p>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-200">Travel days</p>
              </div>
              <div className="rounded-2xl bg-white/12 p-4 ring-1 ring-white/15">
                <MapPin className="mb-3 h-5 w-5 text-emerald-300" />
                <p className="text-3xl font-black">{tripActivities.length}</p>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-200">Destinations</p>
              </div>
              <div className="rounded-2xl bg-white/12 p-4 ring-1 ring-white/15">
                <Users className="mb-3 h-5 w-5 text-emerald-300" />
                <p className="text-3xl font-black">{tripDetails.travelers}</p>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-200">Travelers</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {tripActivities.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-20 bg-card rounded-2xl border border-border shadow-sm"
          >
            <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Calendar className="w-12 h-12 text-primary" />
            </div>
            <h2 className="text-2xl mb-3">Start Planning Your Journey</h2>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              Add destinations from the Home page. Your plan will be saved in this browser using local storage.
            </p>
            <Link
              to="/home"
              className="inline-flex items-center gap-2 px-5 py-3 bg-primary text-black rounded-lg hover:bg-primary/90 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Browse Destinations
            </Link>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-card rounded-xl p-6 shadow-md">
                <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-4 mb-6">
                  <div>
                    <h2 className="text-2xl mb-2">Trip Details</h2>
                    <p className="text-sm text-muted-foreground">
                      Edit these fields and they will be saved locally on your device.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 print:hidden">
                    <button
                      onClick={savePlan}
                      className="px-4 py-2 bg-primary text-black rounded-lg hover:bg-primary/90 transition-colors inline-flex items-center gap-2"
                    >
                      <Save className="w-4 h-4" />
                      Save Plan
                    </button>
                    <button
                      onClick={copyPlan}
                      className="px-4 py-2 bg-secondary text-white rounded-lg hover:bg-secondary/90 transition-colors inline-flex items-center gap-2"
                    >
                      <Copy className="w-4 h-4" />
                      Copy Summary
                    </button>
                    <button
                      onClick={exportPlan}
                      className="px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors inline-flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Export
                    </button>
                    <button
                      onClick={() => window.print()}
                      className="px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors inline-flex items-center gap-2"
                    >
                      <Printer className="w-4 h-4" />
                      Print
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label className="space-y-2">
                    <span className="text-sm text-muted-foreground">Trip title</span>
                    <input
                      value={tripDetails.title}
                      onChange={(event) => updateTripDetail("title", event.target.value)}
                      className="w-full px-4 py-2 rounded-lg bg-input-background border border-border focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </label>

                  <label className="space-y-2">
                    <span className="text-sm text-muted-foreground">Travelers</span>
                    <input
                      type="number"
                      min="1"
                      value={tripDetails.travelers}
                      onChange={(event) =>
                        updateTripDetail("travelers", Math.max(1, Number(event.target.value)))
                      }
                      className="w-full px-4 py-2 rounded-lg bg-input-background border border-border focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </label>

                  <label className="space-y-2">
                    <span className="text-sm text-muted-foreground">Start date</span>
                    <input
                      type="date"
                      value={tripDetails.startDate}
                      onChange={(event) => updateTripDetail("startDate", event.target.value)}
                      className="w-full px-4 py-2 rounded-lg bg-input-background border border-border focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </label>

                  <label className="space-y-2">
                    <span className="text-sm text-muted-foreground">End date</span>
                    <input
                      type="date"
                      value={tripDetails.endDate}
                      min={tripDetails.startDate}
                      onChange={(event) => updateTripDetail("endDate", event.target.value)}
                      className="w-full px-4 py-2 rounded-lg bg-input-background border border-border focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </label>

                  <label className="space-y-2 md:col-span-2">
                    <span className="text-sm text-muted-foreground">Total budget</span>
                    <input
                      type="number"
                      min="0"
                      placeholder="Example: 1500"
                      value={tripDetails.budget || ""}
                      onChange={(event) =>
                        updateTripDetail("budget", Math.max(0, Number(event.target.value)))
                      }
                      className="w-full px-4 py-2 rounded-lg bg-input-background border border-border focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </label>
                </div>
              </div>

              <div className="bg-card rounded-xl p-6 shadow-md">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-xl">Editable Itinerary</h3>
                    <p className="text-sm text-muted-foreground">
                      Set date, time, cost, duration, and notes for each destination.
                    </p>
                  </div>
                  <Link
                    to="/home"
                    className="print:hidden px-4 py-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors inline-flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add More
                  </Link>
                </div>

                <div className="space-y-4">
                  {tripActivities.map((activity, index) => (
                    <div
                      key={activity.id}
                      className="border border-border rounded-xl p-4 hover:border-primary transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4 mb-4">
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-3 mb-2">
                            <span className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-medium">
                              {index + 1}
                            </span>
                            <h4 className="text-lg">{activity.name}</h4>
                            <span className="px-2 py-0.5 bg-primary/10 text-primary rounded text-xs">
                              {activity.category}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <MapPin className="w-4 h-4" />
                            <span>{activity.location}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 print:hidden">
                          <button
                            onClick={() => moveActivity(activity.id, "up")}
                            disabled={index === 0}
                            className="p-2 rounded-lg border border-border hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed"
                            aria-label="Move activity up"
                          >
                            <ArrowUp className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => moveActivity(activity.id, "down")}
                            disabled={index === tripActivities.length - 1}
                            className="p-2 rounded-lg border border-border hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed"
                            aria-label="Move activity down"
                          >
                            <ArrowDown className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => removeActivity(activity.id)}
                            className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                            aria-label="Remove activity"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3">
                        <label className="space-y-1">
                          <span className="text-xs text-muted-foreground">Date</span>
                          <input
                            type="date"
                            value={activity.date}
                            onChange={(event) =>
                              updateActivity(activity.id, { date: event.target.value })
                            }
                            className="w-full px-3 py-2 rounded-lg bg-input-background border border-border focus:outline-none focus:ring-2 focus:ring-primary"
                          />
                        </label>

                        <label className="space-y-1">
                          <span className="text-xs text-muted-foreground">Time</span>
                          <input
                            type="time"
                            value={activity.time}
                            onChange={(event) =>
                              updateActivity(activity.id, { time: event.target.value })
                            }
                            className="w-full px-3 py-2 rounded-lg bg-input-background border border-border focus:outline-none focus:ring-2 focus:ring-primary"
                          />
                        </label>

                        <label className="space-y-1">
                          <span className="text-xs text-muted-foreground">Cost / person</span>
                          <input
                            type="number"
                            min="0"
                            placeholder="0"
                            value={activity.cost ?? ""}
                            onChange={(event) =>
                              updateActivity(activity.id, {
                                cost: event.target.value === "" ? null : Math.max(0, Number(event.target.value)),
                              })
                            }
                            className="w-full px-3 py-2 rounded-lg bg-input-background border border-border focus:outline-none focus:ring-2 focus:ring-primary"
                          />
                        </label>

                        <label className="space-y-1">
                          <span className="text-xs text-muted-foreground">Duration</span>
                          <input
                            value={activity.duration}
                            placeholder="2 hours"
                            onChange={(event) =>
                              updateActivity(activity.id, { duration: event.target.value })
                            }
                            className="w-full px-3 py-2 rounded-lg bg-input-background border border-border focus:outline-none focus:ring-2 focus:ring-primary"
                          />
                        </label>
                      </div>

                      <label className="space-y-1 block">
                        <span className="text-xs text-muted-foreground">Notes</span>
                        <textarea
                          value={activity.notes}
                          placeholder="Add meeting point, transport note, dress code, ticket reminder..."
                          onChange={(event) =>
                            updateActivity(activity.id, { notes: event.target.value })
                          }
                          rows={2}
                          className="w-full px-3 py-2 rounded-lg bg-input-background border border-border focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                        />
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="lg:col-span-1 space-y-6">
              <div className="bg-card rounded-xl p-6 shadow-md sticky top-24">
                <h3 className="text-xl mb-6">Trip Summary</h3>

                <div className="grid grid-cols-2 gap-3 mb-6">
                  <div className="p-4 bg-muted rounded-lg">
                    <MapPin className="w-5 h-5 text-primary mb-2" />
                    <p className="text-2xl font-bold">{tripActivities.length}</p>
                    <p className="text-xs text-muted-foreground">Destinations</p>
                  </div>
                  <div className="p-4 bg-muted rounded-lg">
                    <Calendar className="w-5 h-5 text-primary mb-2" />
                    <p className="text-2xl font-bold">{tripDays}</p>
                    <p className="text-xs text-muted-foreground">Trip day{tripDays === 1 ? "" : "s"}</p>
                  </div>
                  <div className="p-4 bg-muted rounded-lg">
                    <Users className="w-5 h-5 text-primary mb-2" />
                    <p className="text-2xl font-bold">{tripDetails.travelers}</p>
                    <p className="text-xs text-muted-foreground">Traveler{tripDetails.travelers === 1 ? "" : "s"}</p>
                  </div>
                  <div className="p-4 bg-muted rounded-lg">
                    <ClipboardList className="w-5 h-5 text-primary mb-2" />
                    <p className="text-2xl font-bold">
                      {completedChecklistItems}/{checklist.length}
                    </p>
                    <p className="text-xs text-muted-foreground">Checklist</p>
                  </div>
                </div>

                <div className="bg-primary/10 rounded-lg p-4 mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Estimated total</span>
                    <span className="text-2xl font-bold text-primary">{formatMoney(totalCost)}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">
                    This is only a planning estimate.
                  </p>
                  {tripDetails.budget > 0 && (
                    <>
                      <div className="h-2 bg-white rounded-full overflow-hidden mb-2">
                        <div
                          className="h-full bg-primary rounded-full"
                          style={{ width: `${budgetUsedPercent}%` }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {remainingBudget >= 0
                          ? `${formatMoney(remainingBudget)} remaining from your budget.`
                          : `${formatMoney(Math.abs(remainingBudget))} over your budget.`}
                      </p>
                    </>
                  )}
                </div>

                <button
                  onClick={resetPlan}
                  className="print:hidden w-full py-3 border border-destructive text-destructive rounded-lg hover:bg-destructive/10 transition-colors"
                >
                  Clear Trip Plan
                </button>
              </div>

              <div className="bg-card rounded-xl p-6 shadow-md">
                <h3 className="text-xl mb-4">Travel Checklist</h3>
                <div className="space-y-3 mb-4">
                  {checklist.map((item) => (
                    <div key={item.id} className="flex items-center gap-3">
                      <button
                        onClick={() =>
                          setChecklist((currentItems) =>
                            currentItems.map((currentItem) =>
                              currentItem.id === item.id
                                ? { ...currentItem, done: !currentItem.done }
                                : currentItem
                            )
                          )
                        }
                        className={`w-5 h-5 rounded border flex items-center justify-center ${
                          item.done
                            ? "bg-primary border-primary text-black"
                            : "border-border hover:border-primary"
                        }`}
                        aria-label={`Toggle ${item.text}`}
                      >
                        {item.done && <Check className="w-3 h-3" />}
                      </button>
                      <span className={`flex-1 text-sm ${item.done ? "line-through text-muted-foreground" : ""}`}>
                        {item.text}
                      </span>
                      <button
                        onClick={() =>
                          setChecklist((currentItems) =>
                            currentItems.filter((currentItem) => currentItem.id !== item.id)
                          )
                        }
                        className="print:hidden text-muted-foreground hover:text-destructive"
                        aria-label={`Remove ${item.text}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="print:hidden flex gap-2">
                  <input
                    value={newChecklistItem}
                    onChange={(event) => setNewChecklistItem(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        addChecklistItem();
                      }
                    }}
                    placeholder="Add checklist item"
                    className="flex-1 px-3 py-2 rounded-lg bg-input-background border border-border focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <button
                    onClick={addChecklistItem}
                    className="px-4 py-2 bg-primary text-black rounded-lg hover:bg-primary/90 transition-colors"
                    aria-label="Add checklist item"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="print:hidden bg-muted rounded-xl p-5">
                <h4 className="font-medium mb-2">Frontend-only mode</h4>
                <p className="text-sm text-muted-foreground">
                  Your plan is stored in this browser with localStorage. It will survive page refreshes, but it is not shared across devices.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
