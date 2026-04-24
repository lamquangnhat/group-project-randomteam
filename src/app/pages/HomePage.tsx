import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Star, X, MapPin, DollarSign, Clock, Heart, Bookmark } from "lucide-react";
import { useTripPlan } from "../context/TripPlanContext";

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

const categories = ["All", "Hotel", "Beach", "Food", "Drinks", "Bar", "Stadium", "Mountain", "Waterpark", "Aura"];

const destinations: Destination[] = [
  {
    id: 1,
    name: "Paradise Beach Resort",
    category: "Hotel",
    image: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800",
    rating: 4.8,
    reviews: 1243,
    location: "Maldives",
    price: "$$$",
    description: "Luxury beachfront resort with stunning ocean views",
    fullDescription: "Experience paradise at our exclusive beachfront resort. With pristine white sand beaches, crystal-clear waters, and world-class amenities, your dream vacation awaits. Each room features a private balcony overlooking the ocean, modern amenities, and elegant tropical decor.",
    features: ["Private Beach", "Infinity Pool", "Spa & Wellness", "Fine Dining", "Water Sports"],
    hours: "Check-in: 3:00 PM | Check-out: 11:00 AM"
  },
  {
    id: 2,
    name: "Mountain Peak Lodge",
    category: "Mountain",
    image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800",
    rating: 4.9,
    reviews: 856,
    location: "Swiss Alps",
    price: "$$$$",
    description: "Cozy mountain retreat with breathtaking alpine views",
    fullDescription: "Nestled high in the Swiss Alps, our mountain lodge offers the perfect escape for nature lovers and adventure seekers. Enjoy panoramic mountain views, hiking trails, and world-class skiing in winter. Each chalet-style room combines rustic charm with modern comfort.",
    features: ["Ski-in/Ski-out", "Mountain Views", "Fireplace", "Hiking Trails", "Restaurant"],
    hours: "Open Year-round | 24/7 Reception"
  },
  {
    id: 3,
    name: "Ocean Breeze Waterpark",
    category: "Waterpark",
    image: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800",
    rating: 4.6,
    reviews: 2103,
    location: "Florida, USA",
    price: "$$",
    description: "Family-friendly waterpark with thrilling slides and attractions",
    fullDescription: "Make a splash at the most exciting waterpark in Florida! With over 30 slides, a lazy river, wave pool, and kids' play areas, there's something for everyone. Cool off in our tropical paradise while creating unforgettable memories with your family.",
    features: ["30+ Water Slides", "Wave Pool", "Lazy River", "Kids Zone", "Food Court"],
    hours: "Daily: 10:00 AM - 6:00 PM (Seasonal)"
  },
  {
    id: 4,
    name: "Gourmet Heaven",
    category: "Food",
    image: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800",
    rating: 4.7,
    reviews: 678,
    location: "Paris, France",
    price: "$$$",
    description: "Michelin-starred restaurant with exquisite French cuisine",
    fullDescription: "Indulge in a culinary journey at our Michelin-starred restaurant. Our master chefs create innovative dishes using the finest local ingredients, paired with an extensive wine collection. The elegant ambiance and impeccable service ensure an unforgettable dining experience.",
    features: ["Michelin Star", "Wine Cellar", "Seasonal Menu", "Private Dining", "Chef's Table"],
    hours: "Dinner: 6:00 PM - 11:00 PM | Closed Mondays"
  },
  {
    id: 5,
    name: "Sunset Beach Club",
    category: "Beach",
    image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800",
    rating: 4.8,
    reviews: 1567,
    location: "Bali, Indonesia",
    price: "$$",
    description: "Pristine beach with crystal-clear waters and water sports",
    fullDescription: "Discover paradise at Sunset Beach Club, where golden sands meet turquoise waters. Whether you're looking to relax under a palm tree, try exciting water sports, or watch the spectacular sunset, this beach offers the perfect tropical getaway.",
    features: ["Beach Loungers", "Snorkeling", "Beach Bar", "Water Sports", "Sunset Views"],
    hours: "Daily: 8:00 AM - 10:00 PM"
  },
  {
    id: 6,
    name: "Skyline Rooftop Bar",
    category: "Bar",
    image: "https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=800",
    rating: 4.5,
    reviews: 923,
    location: "New York, USA",
    price: "$$$",
    description: "Chic rooftop bar with panoramic city views and craft cocktails",
    fullDescription: "Experience the city from new heights at our sophisticated rooftop bar. Sip on expertly crafted cocktails while enjoying 360-degree views of the New York skyline. Our talented mixologists create unique drinks using premium spirits and fresh ingredients.",
    features: ["City Views", "Craft Cocktails", "Live DJ", "VIP Lounge", "Small Plates"],
    hours: "Wed-Sun: 5:00 PM - 2:00 AM"
  },
  {
    id: 7,
    name: "Champions Stadium",
    category: "Stadium",
    image: "https://images.unsplash.com/photo-1459865264687-595d652de67e?w=800",
    rating: 4.9,
    reviews: 3421,
    location: "Barcelona, Spain",
    price: "$$",
    description: "Iconic sports stadium with world-class facilities and tours",
    fullDescription: "Visit one of the world's most famous stadiums and experience sporting history. Take a guided tour through the locker rooms, walk through the player tunnel, and stand on the pitch where legends played. Our museum showcases decades of sporting achievements.",
    features: ["Stadium Tours", "Museum", "Team Store", "Photo Opportunities", "Guided Tours"],
    hours: "Daily: 9:30 AM - 7:00 PM | Match Days Vary"
  },
  {
    id: 8,
    name: "Tropical Cocktail Lounge",
    category: "Drinks",
    image: "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=800",
    rating: 4.6,
    reviews: 534,
    location: "Miami, USA",
    price: "$$",
    description: "Vibrant cocktail bar with tropical vibes and exotic drinks",
    fullDescription: "Transport yourself to a tropical paradise at our vibrant cocktail lounge. Our mixologists blend fresh fruits, premium spirits, and exotic ingredients to create unforgettable drinks. Enjoy live music on weekends in our lush, island-inspired setting.",
    features: ["Signature Cocktails", "Live Music", "Outdoor Seating", "Happy Hour", "Late Night Menu"],
    hours: "Daily: 4:00 PM - 1:00 AM"
  }
];

export function HomePage() {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedDestination, setSelectedDestination] = useState<Destination | null>(null);
  const [likedDestinations, setLikedDestinations] = useState<number[]>([]);
  const [showFavorites, setShowFavorites] = useState(false);
  const { addDestinationToTrip } = useTripPlan();

  const filteredDestinations = selectedCategory === "All"
    ? destinations
    : destinations.filter(d => d.category === selectedCategory);

  const favoriteDestinations = destinations.filter(d => likedDestinations.includes(d.id));

  const toggleLike = (id: number) => {
    setLikedDestinations(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-[#1a3a52] to-[#2d5f7f] text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex items-center justify-between"
          >
            <div>
              <h1 className="text-4xl mb-4">Discover Your Next Adventure</h1>
              <p className="text-xl text-gray-200">Explore curated destinations and experiences from around the world</p>
            </div>
            <button
              onClick={() => setShowFavorites(true)}
              className="relative px-6 py-3 bg-white/10 hover:bg-white/20 rounded-lg transition-colors flex items-center gap-2"
            >
              <Bookmark className="w-5 h-5" />
              <span>My Favorites</span>
              {likedDestinations.length > 0 && (
                <span className="absolute -top-2 -right-2 w-6 h-6 bg-primary text-black rounded-full flex items-center justify-center text-sm">
                  {likedDestinations.length}
                </span>
              )}
            </button>
          </motion.div>
        </div>
      </div>

      {/* Categories */}
      <div className="bg-white border-b border-border sticky top-16 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-2 py-4 overflow-x-auto">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-full whitespace-nowrap transition-all ${
                  selectedCategory === category
                    ? "bg-primary text-black"
                    : "bg-muted text-foreground hover:bg-muted/80"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Destinations Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredDestinations.map((destination) => (
            <motion.div
              key={destination.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="bg-card rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-shadow cursor-pointer group"
              onClick={() => setSelectedDestination(destination)}
            >
              <div className="relative h-48 overflow-hidden">
                <img
                  src={destination.image}
                  alt={destination.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleLike(destination.id);
                  }}
                  className="absolute top-3 right-3 w-10 h-10 bg-white/90 rounded-full flex items-center justify-center hover:bg-white transition-colors"
                >
                  <Heart
                    className={`w-5 h-5 ${likedDestinations.includes(destination.id) ? 'fill-red-500 text-red-500' : 'text-gray-600'}`}
                  />
                </button>
                <div className="absolute bottom-3 left-3 bg-primary text-black px-3 py-1 rounded-full text-sm">
                  {destination.category}
                </div>
              </div>
              <div className="p-4">
                <h3 className="text-lg mb-1">{destination.name}</h3>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                  <MapPin className="w-4 h-4" />
                  <span>{destination.location}</span>
                </div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-accent text-accent" />
                    <span className="text-sm">{destination.rating}</span>
                    <span className="text-sm text-muted-foreground">({destination.reviews})</span>
                  </div>
                  <span className="text-sm text-muted-foreground">{destination.price}</span>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">{destination.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Favorites Modal */}
      <AnimatePresence>
        {showFavorites && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowFavorites(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto shadow-2xl"
            >
              <div className="sticky top-0 bg-white border-b border-border p-6 flex items-center justify-between z-10">
                <div>
                  <h2 className="text-2xl mb-1">My Favorite Destinations</h2>
                  <p className="text-sm text-muted-foreground">
                    {favoriteDestinations.length} {favoriteDestinations.length === 1 ? 'place' : 'places'} saved
                  </p>
                </div>
                <button
                  onClick={() => setShowFavorites(false)}
                  className="w-10 h-10 bg-muted rounded-full flex items-center justify-center hover:bg-muted/80 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6">
                {favoriteDestinations.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                      <Heart className="w-10 h-10 text-muted-foreground" />
                    </div>
                    <h3 className="text-xl mb-2">No favorites yet</h3>
                    <p className="text-muted-foreground">
                      Start exploring and click the heart icon to save your favorite destinations
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {favoriteDestinations.map((destination) => (
                      <motion.div
                        key={destination.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3 }}
                        className="bg-card rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-shadow cursor-pointer group"
                        onClick={() => {
                          setShowFavorites(false);
                          setSelectedDestination(destination);
                        }}
                      >
                        <div className="relative h-48 overflow-hidden">
                          <img
                            src={destination.image}
                            alt={destination.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          />
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleLike(destination.id);
                            }}
                            className="absolute top-3 right-3 w-10 h-10 bg-white/90 rounded-full flex items-center justify-center hover:bg-white transition-colors"
                          >
                            <Heart className="w-5 h-5 fill-red-500 text-red-500" />
                          </button>
                          <div className="absolute bottom-3 left-3 bg-primary text-black px-3 py-1 rounded-full text-sm">
                            {destination.category}
                          </div>
                        </div>
                        <div className="p-4">
                          <h3 className="text-lg mb-1">{destination.name}</h3>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                            <MapPin className="w-4 h-4" />
                            <span>{destination.location}</span>
                          </div>
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-1">
                              <Star className="w-4 h-4 fill-accent text-accent" />
                              <span className="text-sm">{destination.rating}</span>
                              <span className="text-sm text-muted-foreground">({destination.reviews})</span>
                            </div>
                            <span className="text-sm text-muted-foreground">{destination.price}</span>
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2">{destination.description}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Destination Detail Modal */}
      <AnimatePresence>
        {selectedDestination && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedDestination(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl"
            >
              <div className="relative h-80">
                <img
                  src={selectedDestination.image}
                  alt={selectedDestination.name}
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={() => setSelectedDestination(null)}
                  className="absolute top-4 right-4 w-10 h-10 bg-white rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
                <div className="absolute bottom-4 left-4 bg-primary text-black px-4 py-2 rounded-full">
                  {selectedDestination.category}
                </div>
              </div>

              <div className="p-8">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-3xl mb-2">{selectedDestination.name}</h2>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="w-5 h-5" />
                      <span>{selectedDestination.location}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2 mb-1">
                      <Star className="w-5 h-5 fill-accent text-accent" />
                      <span className="text-xl">{selectedDestination.rating}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">{selectedDestination.reviews} reviews</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
                    <DollarSign className="w-5 h-5 text-primary" />
                    <div>
                      <div className="text-sm text-muted-foreground">Price Range</div>
                      <div>{selectedDestination.price}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
                    <Clock className="w-5 h-5 text-primary" />
                    <div>
                      <div className="text-sm text-muted-foreground">Hours</div>
                      <div className="text-sm">{selectedDestination.hours}</div>
                    </div>
                  </div>
                </div>

                <div className="mb-6">
                  <h3 className="text-xl mb-3">About</h3>
                  <p className="text-muted-foreground leading-relaxed">{selectedDestination.fullDescription}</p>
                </div>

                <div className="mb-8">
                  <h3 className="text-xl mb-3">Features & Amenities</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedDestination.features.map((feature, index) => (
                      <span key={index} className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={() => {
                      addDestinationToTrip(selectedDestination);
                      setSelectedDestination(null);
                    }}
                    className="flex-1 py-3 bg-primary text-black rounded-lg hover:bg-primary/90 transition-colors"
                  >
                    Add to Trip Plan
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
