import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import {
  ArrowLeft,
  Calendar,
  Check,
  ChevronDown,
  ClipboardList,
  Copy,
  Files,
  GripVertical,
  MapPin,
  Plus,
  Printer,
  Sparkles,
  Trash2,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { useTripPlan, type TripActivity } from "../context/TripPlanContext";
import { LocationMap, type MapLocation } from "../components/LocationMap";
import { CATEGORY_IMAGES } from "../lib/api";

interface ChecklistItem {
  id: number;
  text: string;
  done: boolean;
}

interface PlanMember {
  email: string;
  role: "viewer" | "editor";
}

interface Plan {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  travelers: number;
  budget: number;
  activities: TripActivity[];
  checklist: ChecklistItem[];
  members: PlanMember[];
  createdAt: string;
}

interface NewPlanDraft {
  title: string;
  startDate: string;
  endDate: string;
  travelers: number;
}

interface DragItem {
  id: number;
  index: number;
}

interface ActivityGroup {
  key: string;
  label: string;
  date: string;
  dateLabel: string;
  items: TripActivity[];
}

const PLANS_KEY = "travelPlanner.plans";
const DRAG_TYPE = "ACTIVITY";

const CITY_CENTRES: Record<string, [number, number]> = {
  "ho chi minh":  [10.7769, 106.7009],
  "saigon":       [10.7769, 106.7009],
  "hanoi":        [21.0245, 105.8412],
  "ha noi":       [21.0245, 105.8412],
  "da nang":      [16.0544, 108.2022],
  "hoi an":       [15.8801, 108.3380],
  "hue":          [16.4637, 107.5909],
  "nha trang":    [12.2388, 109.1967],
  "phu quoc":     [10.2899, 103.9840],
  "da lat":       [11.9404, 108.4583],
  "dalat":        [11.9404, 108.4583],
  "ha long":      [20.9101, 107.1839],
  "halong":       [20.9101, 107.1839],
  "sa pa":        [22.3364, 103.8438],
  "sapa":         [22.3364, 103.8438],
  "can tho":      [10.0452, 105.7469],
  "mui ne":       [10.9436, 108.2876],
  "ninh binh":    [20.2549, 105.9750],
};

function cityFallback(location: string): [number, number] | null {
  const lower = location.toLowerCase();
  for (const [key, coords] of Object.entries(CITY_CENTRES)) {
    if (lower.includes(key)) return coords;
  }
  return null;
}

const DEFAULT_CHECKLIST: ChecklistItem[] = [
  { id: 1, text: "Confirm travel dates", done: false },
  { id: 2, text: "Book transport", done: false },
  { id: 3, text: "Reserve accommodation", done: false },
  { id: 4, text: "Prepare documents", done: false },
  { id: 5, text: "Pack essentials", done: false },
];

function readLS<T>(key: string, fallback: T): T {
  try {
    const v = window.localStorage.getItem(key);
    return v ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
}

function formatMoney(n: number) {
  return n.toLocaleString("vi-VN") + " ₫";
}

function getTripDays(start: string, end: string) {
  if (!start || !end) return 0;
  const diff = new Date(end).getTime() - new Date(start).getTime();
  if (isNaN(diff) || diff < 0) return 0;
  return Math.floor(diff / 86_400_000) + 1;
}

function fmtDate(iso: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function groupActivitiesByDate(activities: TripActivity[], startDate: string): ActivityGroup[] {
  const dated = activities.filter((a) => a.date);
  const undated = activities.filter((a) => !a.date);
  const uniqueDates = [...new Set(dated.map((a) => a.date))].sort();

  const groups: ActivityGroup[] = uniqueDates.map((date, i) => {
    let dayNum: number;
    if (startDate) {
      const diff = Math.round(
        (new Date(date).getTime() - new Date(startDate).getTime()) / 86_400_000
      );
      dayNum = diff + 1;
    } else {
      dayNum = i + 1;
    }
    return {
      key: date,
      label: `Day ${dayNum}`,
      date,
      dateLabel: fmtDate(date),
      items: activities.filter((a) => a.date === date),
    };
  });

  if (undated.length > 0) {
    groups.push({ key: "unscheduled", label: "Unscheduled", date: "", dateLabel: "", items: undated });
  }

  return groups;
}

const inputCls =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100";

export function PlanningPage() {
  const [plans, setPlans] = useState<Plan[]>(() => readLS(PLANS_KEY, []));
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showNewModal, setShowNewModal] = useState(false);
  const { tripActivities, clearTrip } = useTripPlan();

  useEffect(() => {
    window.localStorage.setItem(PLANS_KEY, JSON.stringify(plans));
  }, [plans]);

  const selectedPlan = plans.find((p) => p.id === selectedId) ?? null;

  const updatePlan = (id: string, updates: Partial<Plan>) =>
    setPlans((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)));

  const createPlan = (draft: NewPlanDraft) => {
    const plan: Plan = {
      id: crypto.randomUUID(),
      title: draft.title || "New Trip Plan",
      startDate: draft.startDate,
      endDate: draft.endDate,
      travelers: draft.travelers,
      budget: 0,
      activities: tripActivities,
      checklist: DEFAULT_CHECKLIST.map((i) => ({ ...i })),
      members: [],
      createdAt: new Date().toISOString(),
    };
    setPlans((prev) => [plan, ...prev]);
    if (tripActivities.length) clearTrip();
    setSelectedId(plan.id);
    setShowNewModal(false);
  };

  const deletePlan = (id: string) => {
    setPlans((prev) => prev.filter((p) => p.id !== id));
    if (selectedId === id) setSelectedId(null);
    toast.success("Plan deleted.");
  };

  const duplicatePlan = (id: string) => {
    const plan = plans.find((p) => p.id === id);
    if (!plan) return;
    const copy: Plan = {
      ...plan,
      id: crypto.randomUUID(),
      title: `${plan.title} (Copy)`,
      createdAt: new Date().toISOString(),
      activities: plan.activities.map((a, i) => ({ ...a, id: Date.now() + i })),
      checklist: plan.checklist.map((item) => ({ ...item, done: false })),
      members: [...(plan.members ?? [])],
    };
    setPlans((prev) => [copy, ...prev]);
    setSelectedId(copy.id);
    toast.success("Plan duplicated.");
  };

  const importStaged = (planId: string) => {
    updatePlan(planId, {
      activities: [...(plans.find((p) => p.id === planId)?.activities ?? []), ...tripActivities],
    });
    clearTrip();
    toast.success(`${tripActivities.length} destination${tripActivities.length === 1 ? "" : "s"} imported.`);
  };

  const updateActivity = (planId: string, actId: number, updates: Partial<TripActivity>) =>
    updatePlan(planId, {
      activities: plans
        .find((p) => p.id === planId)!
        .activities.map((a) => (a.id === actId ? { ...a, ...updates } : a)),
    });

  const removeActivity = (planId: string, actId: number) =>
    updatePlan(planId, {
      activities: plans.find((p) => p.id === planId)!.activities.filter((a) => a.id !== actId),
    });

  const reorderActivities = (planId: string, fromIndex: number, toIndex: number) => {
    setPlans((prev) =>
      prev.map((p) => {
        if (p.id !== planId) return p;
        const acts = [...p.activities];
        const [removed] = acts.splice(fromIndex, 1);
        acts.splice(toIndex, 0, removed);
        return { ...p, activities: acts };
      })
    );
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="min-h-screen bg-slate-50">
        <AnimatePresence>
          {showNewModal && (
            <NewPlanModal
              stagedCount={tripActivities.length}
              onConfirm={createPlan}
              onCancel={() => setShowNewModal(false)}
            />
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {selectedPlan ? (
            <EditView
              key={selectedPlan.id}
              plan={selectedPlan}
              stagedCount={tripActivities.length}
              onBack={() => setSelectedId(null)}
              onUpdatePlan={(updates) => updatePlan(selectedPlan.id, updates)}
              onUpdateActivity={(actId, updates) => updateActivity(selectedPlan.id, actId, updates)}
              onRemoveActivity={(actId) => removeActivity(selectedPlan.id, actId)}
              onReorderActivities={(from, to) => reorderActivities(selectedPlan.id, from, to)}
              onDeletePlan={() => deletePlan(selectedPlan.id)}
              onDuplicatePlan={() => duplicatePlan(selectedPlan.id)}
              onImportStaged={() => importStaged(selectedPlan.id)}
            />
          ) : (
            <ListView
              key="list"
              plans={plans}
              stagedCount={tripActivities.length}
              onSelect={setSelectedId}
              onNew={() => setShowNewModal(true)}
              onDelete={deletePlan}
            />
          )}
        </AnimatePresence>
      </div>
    </DndProvider>
  );
}

function NewPlanModal({
  stagedCount,
  onConfirm,
  onCancel,
}: {
  stagedCount: number;
  onConfirm: (draft: NewPlanDraft) => void;
  onCancel: () => void;
}) {
  const today = new Date().toISOString().split("T")[0];
  const [draft, setDraft] = useState<NewPlanDraft>({
    title: "",
    startDate: today,
    endDate: "",
    travelers: 1,
  });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={onCancel}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 16 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
      >
        <div className="mb-5">
          <p className="mb-0.5 text-xs font-bold uppercase tracking-widest text-emerald-600">New Plan</p>
          <h2 className="text-xl font-black text-slate-900">Plan Your Trip</h2>
          {stagedCount > 0 && (
            <p className="mt-1.5 text-sm text-slate-500">
              <span className="font-bold text-emerald-600">{stagedCount}</span> staged destination{stagedCount !== 1 ? "s" : ""} will be added automatically.
            </p>
          )}
        </div>

        <div className="space-y-4">
          <label className="block space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Trip title</span>
            <input
              value={draft.title}
              onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
              placeholder="e.g. Hoi An Weekend"
              className={inputCls}
              autoFocus
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block space-y-1.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Start date</span>
              <input
                type="date"
                value={draft.startDate}
                onChange={(e) => setDraft((d) => ({ ...d, startDate: e.target.value }))}
                className={inputCls}
              />
            </label>
            <label className="block space-y-1.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">End date</span>
              <input
                type="date"
                value={draft.endDate}
                min={draft.startDate}
                onChange={(e) => setDraft((d) => ({ ...d, endDate: e.target.value }))}
                className={inputCls}
              />
            </label>
          </div>

          <label className="block space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Travelers</span>
            <input
              type="number"
              min="1"
              value={draft.travelers}
              onChange={(e) => setDraft((d) => ({ ...d, travelers: Math.max(1, Number(e.target.value)) }))}
              className={inputCls}
            />
          </label>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(draft)}
            className="rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-600"
          >
            Create Plan
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function ListView({
  plans,
  stagedCount,
  onSelect,
  onNew,
  onDelete,
}: {
  plans: Plan[];
  stagedCount: number;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
}) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <section className="border-b border-slate-200 bg-white px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <p className="mb-2 text-sm font-bold uppercase tracking-widest text-emerald-600">
            Trip planner
          </p>
          <h1 className="mb-2 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
            Where to next?
          </h1>
          <p className="mb-8 text-slate-500">
            Build your perfect itinerary, or let AI inspire your next adventure.
          </p>

          <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
            <button
              onClick={onNew}
              className="group flex flex-1 max-w-xs flex-col items-center gap-3 rounded-2xl border-2 border-slate-200 bg-white px-8 py-7 text-left shadow-sm transition hover:-translate-y-1 hover:border-emerald-300 hover:shadow-md sm:max-w-none"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 transition group-hover:bg-emerald-100">
                <Plus className="h-6 w-6 text-emerald-600" />
              </div>
              <div className="text-center">
                <p className="font-black text-slate-900">Create a new trip</p>
                <p className="mt-0.5 text-sm text-slate-500">Start with a blank itinerary</p>
              </div>
            </button>

            <Link
              to="/ai-assistant"
              className="group flex flex-1 max-w-xs flex-col items-center gap-3 rounded-2xl border-2 border-slate-200 bg-white px-8 py-7 text-left shadow-sm transition hover:-translate-y-1 hover:border-violet-300 hover:shadow-md sm:max-w-none"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-50 transition group-hover:bg-violet-100">
                <Sparkles className="h-6 w-6 text-violet-600" />
              </div>
              <div className="text-center">
                <p className="font-black text-slate-900">Plan with AI</p>
                <p className="mt-0.5 text-sm text-slate-500">Get personalised recommendations</p>
              </div>
            </Link>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {stagedCount > 0 && (
          <div className="mb-6 flex items-center justify-between rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4">
            <p className="text-sm font-medium text-emerald-800">
              <span className="font-black">{stagedCount}</span> destination{stagedCount === 1 ? "" : "s"} staged from browsing — create or open a plan to add them.
            </p>
            <button
              onClick={onNew}
              className="ml-4 shrink-0 rounded-full bg-emerald-500 px-4 py-1.5 text-sm font-bold text-white transition hover:bg-emerald-600"
            >
              Create Plan
            </button>
          </div>
        )}

        {plans.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-2xl border border-slate-200 bg-white py-24 text-center shadow-sm"
          >
            <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50">
              <ClipboardList className="h-10 w-10 text-emerald-500" />
            </div>
            <h2 className="mb-2 text-2xl font-black text-slate-900">No plans yet</h2>
            <p className="mx-auto mb-8 max-w-sm text-slate-500">
              Create your first trip plan, or browse destinations and add them to a plan.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <button
                onClick={onNew}
                className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-6 py-3 font-bold text-white shadow-md transition hover:bg-emerald-600"
              >
                <Plus className="h-4 w-4" />
                Create a Plan
              </button>
              <Link
                to="/home"
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-6 py-3 font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Browse Destinations
              </Link>
            </div>
          </motion.div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {plans.map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                onOpen={() => onSelect(plan.id)}
                onDelete={() => onDelete(plan.id)}
              />
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

function PlanCard({ plan, onOpen, onDelete }: { plan: Plan; onOpen: () => void; onDelete: () => void }) {
  const days = getTripDays(plan.startDate, plan.endDate);
  const totalCost = plan.activities.reduce((s, a) => s + (a.cost ?? 0), 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="group cursor-pointer rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-emerald-200 hover:shadow-md"
      onClick={onOpen}
    >
      <div className="mb-4 flex items-start justify-between gap-2">
        <h3 className="font-black text-slate-900 leading-snug">{plan.title}</h3>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="shrink-0 rounded-lg p-1.5 text-slate-300 opacity-0 transition hover:bg-red-50 hover:text-red-400 group-hover:opacity-100"
          aria-label="Delete plan"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      <div className="mb-4 space-y-1.5 text-sm text-slate-500">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 shrink-0 text-slate-400" />
          {plan.startDate
            ? `${fmtDate(plan.startDate)}${plan.endDate ? ` → ${fmtDate(plan.endDate)}` : ""}`
            : "Dates not set"}
        </div>
        {days > 0 && (
          <p className="pl-6 text-xs text-slate-400">{days} day{days === 1 ? "" : "s"}</p>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <span className="flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
          <MapPin className="h-3.5 w-3.5 text-emerald-500" />
          {plan.activities.length} destination{plan.activities.length === 1 ? "" : "s"}
        </span>
        <span className="flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
          <Users className="h-3.5 w-3.5 text-sky-500" />
          {plan.travelers} traveler{plan.travelers === 1 ? "" : "s"}
        </span>
        {totalCost > 0 && (
          <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
            {formatMoney(totalCost)}
          </span>
        )}
      </div>

      <p className="mt-4 text-right text-xs text-slate-400">
        Created {fmtDate(plan.createdAt)}
      </p>
    </motion.div>
  );
}

function DraggableActivityItem({
  activity,
  index,
  onUpdateActivity,
  onRemoveActivity,
  onReorder,
}: {
  activity: TripActivity;
  index: number;
  onUpdateActivity: (actId: number, u: Partial<TripActivity>) => void;
  onRemoveActivity: (actId: number) => void;
  onReorder: (fromIndex: number, toIndex: number) => void;
}) {
  const itemRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<HTMLDivElement>(null);

  const [{ isDragging }, drag] = useDrag<DragItem, void, { isDragging: boolean }>({
    type: DRAG_TYPE,
    item: () => ({ id: activity.id, index }),
    collect: (monitor) => ({ isDragging: monitor.isDragging() }),
  });

  const [{ isOver }, drop] = useDrop<DragItem, void, { isOver: boolean }>({
    accept: DRAG_TYPE,
    collect: (monitor) => ({ isOver: monitor.isOver() }),
    hover(item, monitor) {
      if (!itemRef.current) return;
      const dragIndex = item.index;
      const hoverIndex = index;
      if (dragIndex === hoverIndex) return;

      const rect = itemRef.current.getBoundingClientRect();
      const midY = (rect.bottom - rect.top) / 2;
      const offset = monitor.getClientOffset();
      if (!offset) return;
      const clientY = offset.y - rect.top;

      if (dragIndex < hoverIndex && clientY < midY) return;
      if (dragIndex > hoverIndex && clientY > midY) return;

      onReorder(dragIndex, hoverIndex);
      item.index = hoverIndex;
    },
  });

  drag(handleRef);
  drop(itemRef);

  const imgSrc =
    activity.image ||
    CATEGORY_IMAGES[activity.category?.toLowerCase().replace(" ", "_")] ||
    CATEGORY_IMAGES[
      Object.keys(CATEGORY_IMAGES).find((k) =>
        activity.category?.toLowerCase().includes(k)
      ) ?? ""
    ] ||
    "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800";

  return (
    <div
      ref={itemRef}
      className={`overflow-hidden rounded-2xl border transition ${
        isOver ? "border-emerald-300 bg-emerald-50/30" : "border-slate-200"
      } ${isDragging ? "opacity-40 shadow-lg" : ""}`}
    >
      <div className="relative h-28 w-full overflow-hidden bg-slate-100">
        <img
          src={imgSrc}
          alt={activity.name}
          className="h-full w-full object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800";
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        <div className="absolute left-3 top-3 flex items-center gap-2">
          <div
            ref={handleRef}
            className="cursor-grab rounded-lg bg-white/20 p-1 text-white backdrop-blur-sm transition hover:bg-white/40 active:cursor-grabbing"
            title="Drag to reorder"
          >
            <GripVertical className="h-4 w-4" />
          </div>
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500 text-xs font-black text-white shadow">
            {index + 1}
          </span>
        </div>
        <div className="absolute right-3 top-3 print:hidden">
          <button
            onClick={() => onRemoveActivity(activity.id)}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20 text-white backdrop-blur-sm transition hover:bg-red-500/80"
            aria-label="Remove"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
        <div className="absolute bottom-3 left-3 right-3">
          <h4 className="font-bold leading-tight text-white drop-shadow">{activity.name}</h4>
          <span className="mt-0.5 inline-block rounded-full bg-emerald-500/90 px-2 py-0.5 text-xs font-semibold text-white">
            {activity.category}
          </span>
        </div>
      </div>

      <div className="p-5">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-1.5 text-sm text-slate-500">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" />
            {activity.location}
          </div>
        </div>
      </div>

      <div className="mb-3 grid grid-cols-2 gap-3 md:grid-cols-4">
        <label className="space-y-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Date</span>
          <input
            type="date"
            value={activity.date}
            onChange={(e) => onUpdateActivity(activity.id, { date: e.target.value })}
            className={inputCls}
          />
        </label>
        <label className="space-y-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Time</span>
          <input
            type="time"
            value={activity.time}
            onChange={(e) => onUpdateActivity(activity.id, { time: e.target.value })}
            className={inputCls}
          />
        </label>
        <label className="space-y-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Cost / person</span>
          <input
            type="number"
            min="0"
            placeholder="0"
            value={activity.cost ?? ""}
            onChange={(e) =>
              onUpdateActivity(activity.id, {
                cost: e.target.value === "" ? null : Math.max(0, Number(e.target.value)),
              })
            }
            className={inputCls}
          />
        </label>
        <label className="space-y-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Duration</span>
          <input
            value={activity.duration}
            placeholder="2 hours"
            onChange={(e) => onUpdateActivity(activity.id, { duration: e.target.value })}
            className={inputCls}
          />
        </label>
      </div>

      <label className="block space-y-1">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Notes</span>
        <textarea
          value={activity.notes}
          placeholder="Meeting point, transport, ticket info..."
          onChange={(e) => onUpdateActivity(activity.id, { notes: e.target.value })}
          rows={2}
          className={`${inputCls} resize-none`}
        />
      </label>
      </div>
    </div>
  );
}

function CollaboratorsCard({
  members,
  ownerEmail,
  onAddMember,
  onRemoveMember,
  onChangeRole,
}: {
  members: PlanMember[];
  ownerEmail: string;
  onAddMember: (m: PlanMember) => void;
  onRemoveMember: (email: string) => void;
  onChangeRole: (email: string, role: "viewer" | "editor") => void;
}) {
  const [emailInput, setEmailInput] = useState("");
  const [roleInput, setRoleInput] = useState<"viewer" | "editor">("editor");
  const [error, setError] = useState("");

  const handleAdd = () => {
    const email = emailInput.trim().toLowerCase();
    if (!email) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Enter a valid email address.");
      return;
    }
    if (email === ownerEmail.toLowerCase()) {
      setError("That's your own email (owner).");
      return;
    }
    if (members.some((m) => m.email.toLowerCase() === email)) {
      setError("Already added.");
      return;
    }
    onAddMember({ email, role: roleInput });
    setEmailInput("");
    setError("");
    toast.success(`${email} added as ${roleInput}.`);
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-center gap-2">
        <UserPlus className="h-5 w-5 text-emerald-500" />
        <h3 className="text-lg font-black text-slate-900">Collaborators</h3>
      </div>

      <div className="mb-4 space-y-2">
        <div className="flex items-center justify-between gap-2 rounded-xl bg-emerald-50 px-4 py-2.5">
          <span className="truncate text-sm font-semibold text-emerald-800">{ownerEmail || "You"}</span>
          <span className="shrink-0 rounded-full bg-emerald-500 px-2.5 py-0.5 text-xs font-bold text-white">
            Owner
          </span>
        </div>

        <AnimatePresence initial={false}>
          {members.map((m) => (
            <motion.div
              key={m.email}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50 px-4 py-2.5">
                <span className="min-w-0 flex-1 truncate text-sm text-slate-700">{m.email}</span>
                <div className="relative shrink-0">
                  <select
                    value={m.role}
                    onChange={(e) => onChangeRole(m.email, e.target.value as "viewer" | "editor")}
                    className="appearance-none rounded-lg border border-slate-200 bg-white py-1 pl-3 pr-7 text-xs font-semibold text-slate-600 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                  >
                    <option value="editor">Editor</option>
                    <option value="viewer">Viewer</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-1.5 top-1/2 h-3 w-3 -translate-y-1/2 text-slate-400" />
                </div>
                <button
                  onClick={() => { onRemoveMember(m.email); toast.success(`${m.email} removed.`); }}
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-slate-400 transition hover:bg-red-50 hover:text-red-500"
                  aria-label="Remove collaborator"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="space-y-2">
        <div className="flex gap-2">
          <input
            type="email"
            value={emailInput}
            onChange={(e) => { setEmailInput(e.target.value); setError(""); }}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            placeholder="colleague@example.com"
            className={`${inputCls} flex-1`}
          />
          <div className="relative shrink-0">
            <select
              value={roleInput}
              onChange={(e) => setRoleInput(e.target.value as "viewer" | "editor")}
              className="h-full appearance-none rounded-xl border border-slate-200 bg-white py-2.5 pl-3 pr-7 text-sm font-semibold text-slate-600 outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
            >
              <option value="editor">Editor</option>
              <option value="viewer">Viewer</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          </div>
          <button
            onClick={handleAdd}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500 text-white transition hover:bg-emerald-600"
            aria-label="Add collaborator"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
        {error && <p className="text-xs font-medium text-red-500">{error}</p>}
        <p className="text-xs text-slate-400">
          Editors can modify the plan. Viewers can only read it.
        </p>
      </div>
    </div>
  );
}

function EditView({
  plan,
  stagedCount,
  onBack,
  onUpdatePlan,
  onUpdateActivity,
  onRemoveActivity,
  onReorderActivities,
  onDeletePlan,
  onDuplicatePlan,
  onImportStaged,
}: {
  plan: Plan;
  stagedCount: number;
  onBack: () => void;
  onUpdatePlan: (u: Partial<Plan>) => void;
  onUpdateActivity: (actId: number, u: Partial<TripActivity>) => void;
  onRemoveActivity: (actId: number) => void;
  onReorderActivities: (from: number, to: number) => void;
  onDeletePlan: () => void;
  onDuplicatePlan: () => void;
  onImportStaged: () => void;
}) {
  const [newItem, setNewItem] = useState("");
  const ownerEmail =
    typeof window !== "undefined"
      ? window.localStorage.getItem("userEmail") ?? "You"
      : "You";

  const members: PlanMember[] = plan.members ?? [];

  const handleAddMember = (m: PlanMember) =>
    onUpdatePlan({ members: [...members, m] });

  const handleRemoveMember = (email: string) =>
    onUpdatePlan({ members: members.filter((m) => m.email !== email) });

  const handleChangeRole = (email: string, role: "viewer" | "editor") =>
    onUpdatePlan({ members: members.map((m) => (m.email === email ? { ...m, role } : m)) });

  const totalCost = plan.activities.reduce((s, a) => s + (a.cost ?? 0), 0);
  const doneCount = plan.checklist.filter((i) => i.done).length;
  const tripDays = getTripDays(plan.startDate, plan.endDate);
  const remaining = plan.budget - totalCost;
  const budgetPct = plan.budget ? Math.min(100, Math.round((totalCost / plan.budget) * 100)) : 0;

  const groups = groupActivitiesByDate(plan.activities, plan.startDate);

  const mapLocations: MapLocation[] = plan.activities.flatMap((a, idx) => {
    if (a.latitude && a.longitude) {
      return [{ id: a.id, name: a.name, latitude: a.latitude, longitude: a.longitude, category: a.category }];
    }
    const fb = cityFallback(a.location || "");
    if (!fb) return [];
    const jitter = 0.003 * ((idx % 7) - 3);
    return [{ id: a.id, name: a.name, latitude: fb[0] + jitter, longitude: fb[1] + jitter, category: a.category }];
  });

  const addChecklist = () => {
    const text = newItem.trim();
    if (!text) return;
    onUpdatePlan({ checklist: [...plan.checklist, { id: Date.now(), text, done: false }] });
    setNewItem("");
  };

  const copyPlan = async () => {
    const lines = plan.activities
      .map((a, i) => `${i + 1}. ${a.date} ${a.time} — ${a.name}\n   ${a.location}`)
      .join("\n\n");
    try {
      await navigator.clipboard.writeText(
        `${plan.title}\n${plan.startDate} → ${plan.endDate}\nTravelers: ${plan.travelers}\n\n${lines || "No destinations."}`
      );
      toast.success("Summary copied.");
    } catch {
      toast.error("Could not copy.");
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <section className="border-b border-slate-200 bg-white px-4 py-8 print:hidden sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <button
            onClick={onBack}
            className="mb-5 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 transition hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" />
            All plans
          </button>

          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="mb-1 text-xs font-bold uppercase tracking-widest text-emerald-600">
                Editing
              </p>
              <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
                {plan.title}
              </h1>
              {plan.startDate && (
                <p className="mt-1 text-sm text-slate-500">
                  {fmtDate(plan.startDate)}{plan.endDate ? ` → ${fmtDate(plan.endDate)}` : ""}
                  {tripDays > 0 ? ` · ${tripDays} days` : ""}
                </p>
              )}
            </div>

            <div className="flex shrink-0 gap-3">
              {[
                { icon: Calendar, label: "Days", value: tripDays || "—", bg: "bg-emerald-100 text-emerald-600" },
                { icon: MapPin, label: "Stops", value: plan.activities.length, bg: "bg-[#0f273e] text-emerald-400" },
                { icon: Users, label: "Travelers", value: plan.travelers, bg: "bg-sky-100 text-sky-600" },
              ].map(({ icon: Icon, label, value, bg }) => (
                <div key={label} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                  <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${bg}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-500">{label}</p>
                    <p className="text-lg font-black text-slate-900">{value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {stagedCount > 0 && (
          <div className="mb-6 flex items-center justify-between rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4">
            <p className="text-sm font-medium text-emerald-800">
              <span className="font-black">{stagedCount}</span> new destination{stagedCount === 1 ? "" : "s"} from browsing ready to import.
            </p>
            <button
              onClick={onImportStaged}
              className="ml-4 shrink-0 rounded-full bg-emerald-500 px-4 py-1.5 text-sm font-bold text-white transition hover:bg-emerald-600"
            >
              Import
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-xl font-black text-slate-900">Trip Details</h2>
                <div className="flex gap-2 print:hidden">
                  <button
                    onClick={copyPlan}
                    className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    <Copy className="h-3.5 w-3.5" /> Copy
                  </button>
                  <button
                    onClick={() => window.print()}
                    className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    <Printer className="h-3.5 w-3.5" /> Print
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <label className="space-y-1.5">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Trip title</span>
                  <input value={plan.title} onChange={(e) => onUpdatePlan({ title: e.target.value })} className={inputCls} />
                </label>
                <label className="space-y-1.5">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Travelers</span>
                  <input type="number" min="1" value={plan.travelers} onChange={(e) => onUpdatePlan({ travelers: Math.max(1, Number(e.target.value)) })} className={inputCls} />
                </label>
                <label className="space-y-1.5">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Start date</span>
                  <input type="date" value={plan.startDate} onChange={(e) => onUpdatePlan({ startDate: e.target.value })} className={inputCls} />
                </label>
                <label className="space-y-1.5">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">End date</span>
                  <input type="date" value={plan.endDate} min={plan.startDate} onChange={(e) => onUpdatePlan({ endDate: e.target.value })} className={inputCls} />
                </label>
                <label className="space-y-1.5 md:col-span-2">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Budget (VND)</span>
                  <input type="number" min="0" placeholder="e.g. 1500" value={plan.budget || ""} onChange={(e) => onUpdatePlan({ budget: Math.max(0, Number(e.target.value)) })} className={inputCls} />
                </label>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-black text-slate-900">Itinerary</h2>
                  <p className="mt-0.5 text-sm text-slate-500">Drag to reorder · Set date to organize by day.</p>
                </div>
                <Link
                  to="/home"
                  className="print:hidden inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700"
                >
                  <Plus className="h-4 w-4" /> Add More
                </Link>
              </div>

              {plan.activities.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 py-12 text-center">
                  <MapPin className="mx-auto mb-3 h-8 w-8 text-slate-300" />
                  <p className="font-semibold text-slate-500">No destinations yet</p>
                  <p className="mt-1 text-sm text-slate-400">Browse destinations and click "Add to Trip"</p>
                </div>
              ) : (
                <div className="space-y-8">
                  {groups.map((group) => (
                    <div key={group.key}>
                      <div className="mb-4 flex items-center gap-3">
                        <span className="text-sm font-black text-slate-900">{group.label}</span>
                        {group.date && (
                          <span className="text-sm text-slate-500">{group.dateLabel}</span>
                        )}
                        <div className="flex-1 border-t border-slate-200" />
                        <span className="text-xs font-semibold text-slate-400">
                          {group.items.length} stop{group.items.length !== 1 ? "s" : ""}
                        </span>
                      </div>

                      <div className="space-y-4">
                        {group.items.map((activity) => {
                          const globalIndex = plan.activities.findIndex((a) => a.id === activity.id);
                          return (
                            <DraggableActivityItem
                              key={activity.id}
                              activity={activity}
                              index={globalIndex}
                              onUpdateActivity={onUpdateActivity}
                              onRemoveActivity={onRemoveActivity}
                              onReorder={onReorderActivities}
                            />
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6 lg:col-span-1">

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="mb-5 text-lg font-black text-slate-900">Trip Summary</h3>
              <div className="mb-5 grid grid-cols-2 gap-3">
                {[
                  { icon: MapPin, label: "Destinations", value: plan.activities.length, bg: "bg-[#0f273e] text-emerald-400" },
                  { icon: Calendar, label: "Days", value: tripDays || "—", bg: "bg-emerald-100 text-emerald-600" },
                  { icon: Users, label: "Travelers", value: plan.travelers, bg: "bg-sky-100 text-sky-600" },
                  { icon: ClipboardList, label: "Checklist", value: `${doneCount}/${plan.checklist.length}`, bg: "bg-amber-100 text-amber-600" },
                ].map(({ icon: Icon, label, value, bg }) => (
                  <div key={label} className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                    <div className={`mb-3 flex h-8 w-8 items-center justify-center rounded-lg ${bg}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <p className="text-2xl font-black text-slate-900">{value}</p>
                    <p className="text-xs font-medium text-slate-500">{label}</p>
                  </div>
                ))}
              </div>

              <div className="mb-5 rounded-xl border border-emerald-100 bg-emerald-50 p-4">
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-600">Estimated total</span>
                  <span className="text-xl font-black text-emerald-700">{formatMoney(totalCost)}</span>
                </div>
                <p className="mb-3 text-xs text-slate-500">Planning estimate only.</p>
                {plan.budget > 0 && (
                  <>
                    <div className="mb-1.5 h-2 overflow-hidden rounded-full bg-white">
                      <div
                        className={`h-full rounded-full transition-all ${budgetPct >= 100 ? "bg-red-500" : "bg-emerald-500"}`}
                        style={{ width: `${budgetPct}%` }}
                      />
                    </div>
                    <p className="text-xs font-medium text-slate-500">
                      {remaining >= 0
                        ? `${formatMoney(remaining)} remaining`
                        : `${formatMoney(Math.abs(remaining))} over budget`}
                    </p>
                  </>
                )}
              </div>

              <div className="print:hidden space-y-2">
                <button
                  onClick={onDuplicatePlan}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  <Files className="h-4 w-4" />
                  Duplicate Plan
                </button>
                <button
                  onClick={onDeletePlan}
                  className="w-full rounded-xl border border-red-200 py-2.5 text-sm font-semibold text-red-500 transition hover:bg-red-50"
                >
                  Delete Plan
                </button>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-5 flex items-center justify-between">
                <h3 className="text-lg font-black text-slate-900">Checklist</h3>
                <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-700">
                  {doneCount}/{plan.checklist.length}
                </span>
              </div>

              <div className="mb-4 space-y-2.5">
                {plan.checklist.map((item) => (
                  <div key={item.id} className="flex items-center gap-3">
                    <button
                      onClick={() =>
                        onUpdatePlan({
                          checklist: plan.checklist.map((i) =>
                            i.id === item.id ? { ...i, done: !i.done } : i
                          ),
                        })
                      }
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border transition ${
                        item.done
                          ? "border-emerald-500 bg-emerald-500 text-white"
                          : "border-slate-300 hover:border-emerald-400"
                      }`}
                    >
                      {item.done && <Check className="h-3 w-3" />}
                    </button>
                    <span className={`flex-1 text-sm ${item.done ? "text-slate-400 line-through" : "text-slate-700"}`}>
                      {item.text}
                    </span>
                    <button
                      onClick={() => onUpdatePlan({ checklist: plan.checklist.filter((i) => i.id !== item.id) })}
                      className="print:hidden text-slate-300 transition hover:text-red-400"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="print:hidden flex gap-2">
                <input
                  value={newItem}
                  onChange={(e) => setNewItem(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addChecklist()}
                  placeholder="Add an item..."
                  className={`${inputCls} flex-1`}
                />
                <button
                  onClick={addChecklist}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500 text-white transition hover:bg-emerald-600"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                <h3 className="font-black text-slate-900">Map</h3>
                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-500">
                  {mapLocations.length} pin{mapLocations.length !== 1 ? "s" : ""}
                </span>
              </div>
              {mapLocations.length > 0 ? (
                <LocationMap locations={mapLocations} style={{ height: 300 }} />
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <MapPin className="mb-2 h-8 w-8 text-slate-200" />
                  <p className="text-sm text-slate-400">
                    Add destinations to your plan to see them here.
                  </p>
                </div>
              )}
            </div>

            <CollaboratorsCard
              members={members}
              ownerEmail={ownerEmail}
              onAddMember={handleAddMember}
              onRemoveMember={handleRemoveMember}
              onChangeRole={handleChangeRole}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
