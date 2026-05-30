"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    ChevronRight, Star, ShoppingBag, Leaf,
    Clock, ShieldCheck, MapPin, Menu as MenuIcon, X,
    Utensils, Truck, Heart
} from "lucide-react";




// --- Types ---
interface MenuItem {
    id: number;
    name: string;
    price: number;
    image: string;
    isVeg: boolean;
}

interface Plan {
    id: number;
    name: string;
    price: string;
    meals: string;
    recommended?: boolean;
}


// --- Mock Data ---
const DATES = [
    "Thu 5 Mar", "Fri 6 Mar", "Sat 7 Mar", "Sun 8 Mar", "Mon 9 Mar", "Tue 10 Mar", "Sun 15 Mar"
];

const MEAL_TYPES = ["All", "Breakfast", "Lunch", "Dinner"];

const MENU_DATA = {
    Lunch: {
        main: [
            { id: 1, name: "Peri Peri Paneer Rice Bowl", desc: "Peri peri paneer rice bowl", isVeg: true, image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=100" },
            { id: 2, name: "Peri Peri Chicken Rice Bowl", desc: "Peri peri chicken rice bowl", isVeg: false, image: "https://images.unsplash.com/photo-1599481238640-4c1288750d7a?w=100" },
        ],
        addons: [
            { id: 101, name: "Cold Coffee", price: "+₹70", image: "https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=100" },
            { id: 102, name: "Chicken Leg 65", price: "+₹130", image: "https://images.unsplash.com/photo-1562967914-608f82629710?w=100" },
            { id: 103, name: "Apple Milkshake", price: "+₹75", image: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=100" },
        ]
    }
};

// --- Mock Data ---
const MENU_ITEMS: MenuItem[] = [
    { id: 1, name: "Homestyle Dal Tadka Thali", price: 149, isVeg: true, image: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?q=80&w=400" },
    { id: 2, name: "Village Style Chicken Curry", price: 199, isVeg: false, image: "https://images.unsplash.com/photo-1603894584104-629849208035?q=80&w=400" },
    { id: 3, name: "Paneer Butter Masala Bowl", price: 179, isVeg: true, image: "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?q=80&w=400" },
    { id: 4, name: "Aloo Gobhi Matar Box", price: 129, isVeg: true, image: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?q=80&w=400" },
];

const PLANS: Plan[] = [
    { id: 1, name: "3 Day Trial", price: "₹449", meals: "Lunch or Dinner", recommended: false },
    { id: 2, name: "7 Day Plan", price: "₹999", meals: "Lunch + Dinner", recommended: false },
    { id: 3, name: "30 Day Plan", price: "₹3999", meals: "Choice of Meals", recommended: true },
    { id: 4, name: "60 Day Plan", price: "₹7499", meals: "Full Customization", recommended: false },
];


const MenuSection = () => (
    <section id="menu" className="py-24 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-end mb-12">
                <div>
                    <h2 className="text-4xl font-bold mb-2">Today's Menu</h2>
                    <p className="text-gray-500">Freshly prepared just for you</p>
                </div>
                <div className="hidden md:flex gap-2">
                    <button className="p-3 border rounded-full hover:bg-gray-50 transition-colors"><ChevronRight className="rotate-180" /></button>
                    <button className="p-3 border rounded-full hover:bg-gray-50 transition-colors"><ChevronRight /></button>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                {MENU_ITEMS.map((item, i) => (
                    <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                        viewport={{ once: true }}
                        whileHover={{ y: -10 }}
                        className="group bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl transition-all overflow-hidden"
                    >
                        <div className="relative h-56 overflow-hidden">
                            <img src={item.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                            <div className={`absolute top-4 right-4 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-white shadow-sm flex items-center gap-1 ${item.isVeg ? 'text-veg' : 'text-nonveg'}`}>
                                <div className={`w-2 h-2 rounded-full ${item.isVeg ? 'bg-veg' : 'bg-nonveg'}`} />
                                {item.isVeg ? 'Veg' : 'Non-veg'}
                            </div>
                        </div>
                        <div className="p-6">
                            <h3 className="text-lg font-bold mb-1">{item.name}</h3>
                            <p className="text-primary font-black text-xl mb-4">₹{item.price}</p>
                            <button className="w-full bg-soft hover:bg-primary hover:text-white text-primary py-3 rounded-2xl font-bold transition-all flex items-center justify-center gap-2">
                                <ShoppingBag size={18} /> Add to Order
                            </button>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    </section>
);

const SubscriptionSection = () => (
    <section id="subscription" className="py-24 px-6 bg-soft">
        <div className="max-w-7xl mx-auto text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Meal Subscription Plans</h2>
            <p className="text-gray-500">Save more with our flexible long-term plans</p>
        </div>

        <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-6">
            {PLANS.map((plan, i) => (
                <motion.div
                    key={plan.id}
                    initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.1 }}
                    className={`relative p-8 rounded-3xl flex flex-col items-center text-center transition-all ${plan.recommended ? 'bg-primary text-white shadow-2xl scale-105 z-10' : 'bg-white text-textdark border border-gray-100'}`}
                >
                    {plan.recommended && <div className="absolute -top-4 bg-accent text-white px-4 py-1 rounded-full text-xs font-bold shadow-lg uppercase tracking-wider">Most Popular</div>}
                    <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                    <p className="text-4xl font-black mb-6">{plan.price}</p>
                    <ul className="space-y-4 mb-10 text-sm opacity-90 font-medium">
                        <li className="flex items-center gap-2"><Clock size={16} /> {plan.meals}</li>
                        <li className="flex items-center gap-2"><Leaf size={16} /> Veg / Non-Veg Option</li>
                        <li className="flex items-center gap-2"><ShieldCheck size={16} /> Weekend Available</li>
                    </ul>
                    <button className={`w-full py-4 rounded-2xl font-bold transition-all mt-auto ${plan.recommended ? 'bg-white text-primary hover:bg-gray-100' : 'bg-primary text-white hover:bg-accent'}`}>
                        Subscribe Now
                    </button>
                </motion.div>
            ))}
        </div>
    </section>
);


export default function DetailedMenu() {
    const [selectedDate, setSelectedDate] = useState("Tue 10 Mar");
    const [selectedMeal, setSelectedMeal] = useState("Lunch");
    const [dietaryFilter, setDietaryFilter] = useState<"Veg" | "Non-Veg" | null>(null);

    // Filter items based on dietary choice
    const filteredMain = MENU_DATA.Lunch.main.filter(item => {
        if (!dietaryFilter) return true;
        return dietaryFilter === "Veg" ? item.isVeg : !item.isVeg;
    });

    return (
        <section className="py-16 px-6 max-w-7xl mx-auto font-sans">
            {/* --- Header --- */}
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
                <div>
                    <span className="text-green font-bold text-xs uppercase tracking-widest mb-2 block">Weekly Menu</span>
                    <h2 className="text-4xl font-bold text-textdark mb-2">See what's cooking</h2>
                    <p className="text-gray-500 max-w-lg">A new menu every week. Fresh, exciting, and always delicious.</p>
                </div>
                <button className="flex items-center gap-2 px-5 py-2.5 border border-gray-200 rounded-full text-sm font-semibold hover:bg-gray-50 transition-colors w-fit">
                    See past menus <ChevronRight size={16} />
                </button>
            </div>

            {/* --- Dietary Toggles --- */}
            <div className="flex gap-3 mb-10">
                <button
                    onClick={() => setDietaryFilter(dietaryFilter === "Veg" ? null : "Veg")}
                    className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-bold transition-all border ${dietaryFilter === "Veg" ? 'bg-green/10 border-green text-green' : 'bg-gray-50 border-transparent text-gray-500 hover:border-gray-200'}`}
                >
                    <div className="w-2 h-2 rounded-full bg-green" /> Pure Veg
                </button>
                <button
                    onClick={() => setDietaryFilter(dietaryFilter === "Non-Veg" ? null : "Non-Veg")}
                    className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-bold transition-all border ${dietaryFilter === "Non-Veg" ? 'bg-red-50 border-red-500 text-red-500' : 'bg-gray-50 border-transparent text-gray-500 hover:border-gray-200'}`}
                >
                    <div className="w-2 h-2 rounded-full bg-red-500" /> Non-Veg
                </button>
            </div>

            {/* --- Date & Meal Selector Container --- */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden mb-8">
                {/* Date Row */}
                <div className="flex items-center gap-2 p-4 overflow-x-auto no-scrollbar border-b border-gray-50">
                    {DATES.map((date) => (
                        <button
                            key={date}
                            onClick={() => setSelectedDate(date)}
                            className={`px-5 py-2.5 rounded-xl text-[13px] font-bold whitespace-nowrap transition-all ${selectedDate === date
                                    ? "bg-[#4a7c2c] text-white shadow-lg shadow-green/20"
                                    : "bg-gray-50 text-gray-400 hover:bg-gray-100"
                                }`}
                        >
                            {date}
                        </button>
                    ))}
                </div>

                {/* Meal Type Row */}
                <div className="flex items-center gap-6 px-6 py-4 overflow-x-auto no-scrollbar">
                    {MEAL_TYPES.map((type) => (
                        <button
                            key={type}
                            onClick={() => setSelectedMeal(type)}
                            className={`px-5 py-1.5 rounded-lg text-sm font-bold transition-all relative ${selectedMeal === type ? "text-textdark" : "text-gray-400 hover:text-gray-600"
                                }`}
                        >
                            {type}
                            {selectedMeal === type && (
                                <motion.div
                                    layoutId="meal-pill"
                                    className={`absolute inset-0 -z-10 rounded-lg ${type === 'Lunch' ? 'bg-primary' : 'bg-gray-100'}`}
                                    style={type === 'Lunch' ? { backgroundColor: '#F59E0B', color: 'white' } : {}}
                                />
                            )}
                            {/* Force text color to white for the specific orange selected Lunch tab */}
                            {selectedMeal === type && type === 'Lunch' && <span className="absolute inset-0 flex items-center justify-center text-white">{type}</span>}
                        </button>
                    ))}
                </div>
            </div>

            {/* --- Main Content Card --- */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={selectedMeal + selectedDate + dietaryFilter}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden"
                >
                    {/* Section Header */}
                    <div className="bg-soft p-6 flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white shadow-sm">
                            <Utensils size={20} />
                        </div>
                        <h3 className="text-xl font-bold text-textdark">{selectedMeal}</h3>
                    </div>

                    <div className="p-8">
                        {/* Main Items List */}
                        <div className="space-y-6 mb-12">
                            {filteredMain.length > 0 ? filteredMain.map((item) => (
                                <div key={item.id} className="flex items-center gap-5 group cursor-pointer">
                                    <div className="w-16 h-16 rounded-2xl overflow-hidden bg-gray-100 shrink-0">
                                        <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-textdark text-lg leading-tight">{item.name}</h4>
                                        <p className="text-sm text-gray-400 capitalize">{item.desc}</p>
                                    </div>
                                </div>
                            )) : (
                                <p className="text-gray-400 italic py-4">No items found for this selection.</p>
                            )}
                        </div>

                        {/* Add-ons Section */}
                        <div className="relative mb-8">
                            <div className="absolute inset-0 flex items-center" aria-hidden="true">
                                <div className="w-full border-t border-gray-100"></div>
                            </div>
                            <div className="relative flex justify-center">
                                <span className="bg-white px-4 text-[10px] font-black uppercase tracking-[0.2em] text-gray-300">Add-ons</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6 mb-8">
                            {MENU_DATA.Lunch.addons.map((addon) => (
                                <div key={addon.id} className="flex items-center gap-4 group cursor-pointer">
                                    <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-100 shrink-0">
                                        <img src={addon.image} alt={addon.name} className="w-full h-full object-cover" />
                                    </div>
                                    <div>
                                        <p className="text-[13px] font-bold text-textdark group-hover:text-primary transition-colors">{addon.name}</p>
                                        <p className="text-[13px] font-bold text-primary">{addon.price}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <button className="text-green font-bold text-sm hover:underline flex items-center gap-1">
                            + 4 More Add-ons
                        </button>
                    </div>
                </motion.div>
            </AnimatePresence>
        </section>
    );
}


export {
    MenuSection,
    MenuIcon,
    DetailedMenu,
    SubscriptionSection,
}