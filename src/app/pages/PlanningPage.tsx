import { MapPin, DollarSign, Clock, Trash2, Save, Calendar } from "lucide-react";
import { motion } from "motion/react";
import { useTripPlan } from "../context/TripPlanContext";

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

export function PlanningPage() {
  const { tripActivities, removeActivity } = useTripPlan();

  const activities = tripActivities;

  const totalCost = activities.reduce((sum, activity) => sum + (activity.cost || 0), 0);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-[#1a3a52] to-[#2d5f7f] text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-4xl mb-4">Plan Your Perfect Trip</h1>
            <p className="text-xl text-gray-200">Create detailed itineraries and collaborate with your travel companions</p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {activities.length === 0 ? (
          /* Empty State */
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-20"
          >
            <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Calendar className="w-12 h-12 text-primary" />
            </div>
            <h2 className="text-2xl mb-3">Start Planning Your Journey</h2>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              Add destinations from the Home page to start building your itinerary. Browse our curated destinations and click "Add to Trip Plan" to get started.
            </p>
          </motion.div>
        ) : (
          /* Trip Planning Interface */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Trip Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Trip Header */}
              <div className="bg-card rounded-xl p-6 shadow-md">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-2xl mb-2">My Trip Plan</h2>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        <span>{activities.length} {activities.length === 1 ? 'destination' : 'destinations'}</span>
                      </div>
                    </div>
                  </div>
                  <button className="px-4 py-2 bg-primary text-black rounded-lg hover:bg-primary/90 transition-colors inline-flex items-center gap-2">
                    <Save className="w-4 h-4" />
                    Save Plan
                  </button>
                </div>
              </div>

              {/* Activities Timeline */}
              <div className="bg-card rounded-xl p-6 shadow-md">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl">Itinerary</h3>
                </div>

                <div className="space-y-4">
                  {activities.map((activity) => (
                    <div key={activity.id} className="border border-border rounded-lg p-4 hover:border-primary transition-colors">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="text-lg">{activity.name}</h4>
                            <span className="px-2 py-0.5 bg-primary/10 text-primary rounded text-xs">
                              {activity.category}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              <span>{activity.date}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              <span>{activity.time}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              <span>{activity.location}</span>
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => removeActivity(activity.id)}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {activity.cost !== null && (
                            <div className="flex items-center gap-1 text-sm">
                              <DollarSign className="w-4 h-4 text-primary" />
                              <span className="font-medium">${activity.cost}</span>
                              <span className="text-muted-foreground">per person</span>
                            </div>
                          )}
                          {activity.cost === null && (
                            <span className="text-sm text-muted-foreground">Price varies</span>
                          )}
                        </div>
                        {activity.bookable && (
                          <button className="px-4 py-1.5 bg-secondary text-white rounded-lg hover:bg-secondary/90 transition-colors text-sm">
                            Reserve Now
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column - Cost Summary */}
            <div className="lg:col-span-1">
              <div className="bg-card rounded-xl p-6 shadow-md sticky top-24">
                <h3 className="text-xl mb-6">Trip Summary</h3>

                <div className="bg-primary/10 rounded-lg p-4 mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Estimated Total</span>
                    <span className="text-2xl font-bold text-primary">${totalCost}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Per person (excluding variable costs)</p>
                </div>

                <div className="space-y-3">
                  <button className="w-full py-3 bg-primary text-black rounded-lg hover:bg-primary/90 transition-colors">
                    Pay Now
                  </button>
                  <button className="w-full py-3 bg-secondary text-white rounded-lg hover:bg-secondary/90 transition-colors">
                    Share with Group
                  </button>
                </div>

                <div className="mt-6 p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    <strong>Note:</strong> Prices shown are estimates. Final costs may vary based on availability and booking dates.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
