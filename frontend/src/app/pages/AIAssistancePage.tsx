import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Send, MapPin, Compass, Sparkles, Plus, ChevronDown, Check } from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";
import { locationsApi, adaptLocation } from "../lib/api";
import { useTripPlan, type Destination, type TripActivity } from "../context/TripPlanContext";
import { LocationMap } from "../components/LocationMap";

interface AIDest {
  name: string;
  location: string;
  latitude?: number;
  longitude?: number;
}

interface Message {
  id: number;
  role: "user" | "assistant";
  content: string;
  destinations?: AIDest[];
}

interface SavedPlan {
  id: string;
  title: string;
  activities: TripActivity[];
}

const PLANS_KEY = "travelPlanner.plans";

const SUGGESTED = [
  "What are the best beaches in Vietnam?",
  "Plan a 3-day trip to Hoi An",
  "Budget travel tips for Southeast Asia",
  "Top tourist attractions in Hanoi",
];

function readPlans(): SavedPlan[] {
  try {
    const v = localStorage.getItem(PLANS_KEY);
    return v ? JSON.parse(v) : [];
  } catch {
    return [];
  }
}

function writePlans(plans: SavedPlan[]) {
  localStorage.setItem(PLANS_KEY, JSON.stringify(plans));
}

function PlanPicker({
  dest,
  plans,
  addedPlanIds,
  onAddToStaging,
  onAddToPlan,
  onClose,
}: {
  dest: AIDest;
  plans: SavedPlan[];
  addedPlanIds: Set<string>;
  onAddToStaging: () => void;
  onAddToPlan: (planId: string, planTitle: string) => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="absolute right-0 top-full z-20 mt-1.5 w-60 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl"
    >
      <div className="border-b border-slate-100 px-3 py-2">
        <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Add to…</p>
      </div>
      <div className="max-h-52 overflow-y-auto py-1">
        <button
          onClick={() => { onAddToStaging(); onClose(); }}
          className="flex w-full items-center gap-2.5 px-3 py-2.5 text-sm text-slate-700 transition hover:bg-emerald-50 hover:text-emerald-700"
        >
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
            <Plus className="h-3.5 w-3.5" />
          </div>
          <span className="flex-1 text-left font-medium">Staging Area</span>
        </button>

        {plans.length > 0 && (
          <div className="mx-3 my-1 border-t border-slate-100" />
        )}

        {plans.map((plan) => {
          const added = addedPlanIds.has(plan.id);
          return (
            <button
              key={plan.id}
              onClick={() => { if (!added) { onAddToPlan(plan.id, plan.title); onClose(); } }}
              disabled={added}
              className={`flex w-full items-center gap-2.5 px-3 py-2.5 text-sm transition ${
                added
                  ? "cursor-default text-slate-400"
                  : "text-slate-700 hover:bg-slate-50"
              }`}
            >
              <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg ${added ? "bg-emerald-100" : "bg-slate-100"}`}>
                {added ? (
                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                ) : (
                  <MapPin className="h-3.5 w-3.5 text-slate-500" />
                )}
              </div>
              <span className="flex-1 truncate text-left font-medium">{plan.title}</span>
            </button>
          );
        })}

        {plans.length === 0 && (
          <p className="px-3 py-3 text-xs text-slate-400">
            No plans yet — create one on the Planning page.
          </p>
        )}
      </div>
    </div>
  );
}

function DestCard({
  dest,
  rank,
  plans,
}: {
  dest: AIDest;
  rank: number;
  plans: SavedPlan[];
}) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [addedPlanIds, setAddedPlanIds] = useState<Set<string>>(new Set());
  const [addedToStaging, setAddedToStaging] = useState(false);
  const { addDestinationToTrip } = useTripPlan();

  const handleAddToStaging = useCallback(() => {
    const stagingDest: Destination = {
      id: Date.now(),
      name: dest.name,
      category: "Activity",
      image: "",
      rating: 0,
      reviews: 0,
      location: dest.location,
      price: "Free",
      description: "",
      fullDescription: "",
      features: [],
      hours: "",
    };
    addDestinationToTrip(stagingDest);
    setAddedToStaging(true);
  }, [dest, addDestinationToTrip]);

  const handleAddToPlan = useCallback((planId: string, planTitle: string) => {
    const currentPlans = readPlans();
    const newActivity: TripActivity = {
      id: Date.now(),
      name: dest.name,
      category: "Activity",
      date: "",
      time: "09:00",
      cost: null,
      location: dest.location,
      notes: "",
      duration: "2 hours",
    };
    const updated = currentPlans.map((p) =>
      p.id === planId ? { ...p, activities: [...p.activities, newActivity] } : p
    );
    writePlans(updated);
    setAddedPlanIds((prev) => new Set([...prev, planId]));
    toast.success(`Added "${dest.name}" to "${planTitle}"`);
  }, [dest]);

  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
        <MapPin className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-bold text-slate-900">{dest.name}</p>
        <p className="truncate text-xs text-slate-500">{dest.location}</p>
      </div>
      <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-500">
        #{rank}
      </span>

      <div className="relative shrink-0">
        <button
          onClick={() => setPickerOpen((o) => !o)}
          className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-bold transition ${
            addedToStaging || addedPlanIds.size > 0
              ? "bg-emerald-100 text-emerald-700"
              : "bg-emerald-500 text-white hover:bg-emerald-600"
          }`}
        >
          {addedToStaging || addedPlanIds.size > 0 ? (
            <Check className="h-3 w-3" />
          ) : (
            <Plus className="h-3 w-3" />
          )}
          Add
          <ChevronDown className="h-3 w-3" />
        </button>

        {pickerOpen && (
          <PlanPicker
            dest={dest}
            plans={plans}
            addedPlanIds={addedPlanIds}
            onAddToStaging={handleAddToStaging}
            onAddToPlan={handleAddToPlan}
            onClose={() => setPickerOpen(false)}
          />
        )}
      </div>
    </div>
  );
}

export function AIAssistancePage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      role: "assistant",
      content:
        "Hi! I'm your AI travel assistant. Ask me about destinations, itineraries, local tips, or anything travel-related and I'll find matching places for you.",
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [plans, setPlans] = useState<SavedPlan[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const lastMapLocations = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      const msg = messages[i];
      if (msg.role === "assistant" && msg.destinations?.length) {
        return msg.destinations
          .filter((d) => d.latitude && d.longitude)
          .map((d, idx) => ({
            id: idx,
            name: d.name,
            latitude: d.latitude!,
            longitude: d.longitude!,
            category: d.location,
          }));
      }
    }
    return [];
  }, [messages]);

  useEffect(() => {
    setPlans(readPlans());
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = { id: Date.now(), role: "user", content: inputValue };
    setMessages((prev) => [...prev, userMessage]);
    const prompt = inputValue;
    setInputValue("");
    setIsTyping(true);

    setPlans(readPlans());

    try {
      const raw = await locationsApi.aiSearch(prompt);
      const adapted = raw.map(adaptLocation);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: "assistant",
          content:
            adapted.length > 0
              ? `Here ${adapted.length === 1 ? "is" : "are"} ${adapted.length} place${adapted.length === 1 ? "" : "s"} I found for you:`
              : "I couldn't find matching destinations for that. Try rephrasing or ask about a specific city or activity.",
          destinations: adapted.map((d) => ({
            name: d.name,
            location: d.location,
            latitude: d.latitude,
            longitude: d.longitude,
          })),
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: "assistant",
          content:
            "Sorry, I couldn't reach the search service. Please make sure the backend is running and try again.",
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col bg-slate-50">

      <div className="border-b border-slate-200 bg-white px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 shadow-md shadow-emerald-500/25">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="mb-0.5 text-xs font-bold uppercase tracking-widest text-emerald-600">
                AI-powered
              </p>
              <h1 className="text-2xl font-black tracking-tight text-slate-900">
                Travel Assistant
              </h1>
            </div>
          </div>
          <div className="hidden rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-500 sm:block">
            <Compass className="mb-0.5 mr-1.5 inline h-4 w-4 text-emerald-500" />
            Ask for itineraries, beaches, food spots, or destination tips
          </div>
        </div>
      </div>

      <div className="flex flex-1 min-h-0">

        <div className="flex flex-1 flex-col min-h-0">

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">

          {messages.length === 1 && (
            <div className="mb-8">
              <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-400">
                Try asking
              </p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {SUGGESTED.map((q) => (
                  <button
                    key={q}
                    onClick={() => setInputValue(q)}
                    className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-left text-sm font-medium text-slate-700 shadow-sm transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-800"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-6">
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                className={`flex items-end gap-3 ${message.role === "user" ? "flex-row-reverse" : "flex-row"}`}
              >
                {message.role === "assistant" ? (
                  <div className="mb-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 shadow-sm">
                    <Sparkles className="h-4 w-4 text-white" />
                  </div>
                ) : (
                  <div className="mb-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#0f273e]">
                    <span className="text-xs font-bold text-emerald-400">You</span>
                  </div>
                )}

                <div
                  className={`flex max-w-2xl flex-col gap-3 ${message.role === "user" ? "items-end" : "items-start"}`}
                >
                  <div
                    className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                      message.role === "user"
                        ? "bg-emerald-500 text-white"
                        : "border border-slate-200 bg-white text-slate-800 shadow-sm"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  </div>

                  {message.destinations && message.destinations.length > 0 && (
                    <div className="w-full space-y-2">
                      {message.destinations.map((dest, i) => (
                        <DestCard
                          key={i}
                          dest={dest}
                          rank={i + 1}
                          plans={plans}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}

            {isTyping && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-end gap-3"
              >
                <div className="mb-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 shadow-sm">
                  <Sparkles className="h-4 w-4 text-white" />
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white px-5 py-3.5 shadow-sm">
                  <div className="flex gap-1.5">
                    {[0, 150, 300].map((delay) => (
                      <div
                        key={delay}
                        className="h-2 w-2 rounded-full bg-emerald-400 animate-bounce"
                        style={{ animationDelay: `${delay}ms` }}
                      />
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>
      </div>

      <div className="border-t border-slate-200 bg-white px-4 py-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <div className="flex gap-3">
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about destinations, itineraries, travel tips..."
              rows={1}
              style={{ minHeight: "48px", maxHeight: "120px" }}
              className="flex-1 resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
            />
            <button
              onClick={handleSend}
              disabled={!inputValue.trim() || isTyping}
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-md shadow-emerald-500/20 transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Send"
            >
              <Send className="h-5 w-5" />
            </button>
          </div>
          <p className="mt-2 text-center text-xs text-slate-400">
            Press Enter to send · Shift + Enter for a new line
          </p>
        </div>
      </div>

        </div>

        {lastMapLocations.length > 0 && (
          <aside className="hidden w-80 shrink-0 border-l border-slate-200 bg-white lg:flex lg:flex-col">
            <div className="border-b border-slate-100 px-5 py-4">
              <p className="font-black text-slate-900">Locations</p>
              <p className="text-xs text-slate-400">
                {lastMapLocations.length} place{lastMapLocations.length !== 1 ? "s" : ""} found
              </p>
            </div>
            <div className="flex-1 min-h-0">
              <LocationMap
                locations={lastMapLocations}
                style={{ height: "100%" }}
              />
            </div>
          </aside>
        )}

      </div>
    </div>
  );
}
