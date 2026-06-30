"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

import {
    ChevronRight, Star, ShoppingBag, Leaf,
    Clock, ShieldCheck, MapPin, Menu as MenuIcon, X,
    Utensils, Truck, Heart, Mail, Phone, Instagram, Facebook
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
                    className="relative p-8 rounded-3xl flex flex-col items-center text-center transition-all bg-white text-textdark border border-gray-100"
                >
                    <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                    <p className="text-4xl font-black mb-6">{plan.price}</p>
                    <ul className="space-y-4 mb-10 text-sm opacity-90 font-medium">
                        <li className="flex items-center gap-2"><Clock size={16} /> {plan.meals}</li>
                        <li className="flex items-center gap-2"><Leaf size={16} /> Veg / Non-Veg Option</li>
                        <li className="flex items-center gap-2"><ShieldCheck size={16} /> Weekend Available</li>
                    </ul>
                    <button className="w-full py-4 rounded-2xl font-bold transition-all mt-auto bg-primary text-white hover:bg-accent">
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

const HowItWorks = () => (
    <section className="py-24 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
            <h2 className="text-4xl font-bold text-center mb-16">How It Works</h2>
            <div className="grid md:grid-cols-3 gap-12">
                {[
                    { icon: <Utensils />, title: "Choose Your Meal", desc: "Browse our daily changing menu of authentic homemade dishes." },
                    { icon: <Heart />, title: "We Cook Fresh", desc: "Our village chefs prepare your food with love and zero preservatives." },
                    { icon: <Truck />, title: "Delivered To Your Door", desc: "Hot, fresh, and healthy food delivered exactly when you need it." },
                ].map((step, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.2 }}
                        className="text-center group"
                    >
                        <div className="w-20 h-20 bg-soft text-primary rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:bg-primary group-hover:text-white transition-all duration-500 scale-110 rotate-3 group-hover:rotate-0">
                            {React.cloneElement(step.icon as React.ReactElement)}
                        </div>
                        <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                        <p className="text-gray-500 leading-relaxed">{step.desc}</p>
                    </motion.div>
                ))}
            </div>
        </div>
    </section>
);

const Testimonials = () => (
    <section className="py-24 px-6 bg-white overflow-hidden">
        <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl font-bold mb-16">What Our Family Says</h2>
            <motion.div
                animate={{ x: [0, -20, 0] }} transition={{ repeat: Infinity, duration: 10, ease: "linear" }}
                className="bg-soft p-12 rounded-[3rem] relative"
            >
                <div className="flex justify-center mb-6">
                    {[1, 2, 3, 4, 5].map(s => <Star key={s} size={20} fill="#F59E0B" color="#F59E0B" />)}
                </div>
                <p className="text-2xl font-medium text-gray-700 italic leading-relaxed">
                    "The food tastes exactly like what my mother used to make back in my village. It's not just a meal delivery; it's an emotion. Finally, healthy food that I look forward to eating every day!"
                </p>
                <div className="mt-8 flex items-center justify-center gap-4">
                    <div className="w-14 h-14 bg-gray-200 rounded-full overflow-hidden">
                        <img src="https://i.pravatar.cc/100?u=1" alt="avatar" />
                    </div>
                    <div className="text-left">
                        <p className="font-bold">Rahul Sharma</p>
                        <p className="text-sm text-gray-400">Software Engineer, Chennai</p>
                    </div>
                </div>
            </motion.div>
        </div>
    </section>
);



const Footer = () => (
    <footer className="bg-textdark text-white py-20 px-6 font-sans relative overflow-hidden">
        {/* Subtle premium background glow */}
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full filter blur-[120px] -z-10 pointer-events-none" />

        <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-12 border-b border-gray-800 pb-16">
            {/* Column 1: Brand Profile */}
            <div className="col-span-1 md:col-span-1 flex flex-col gap-6">
                <div className="flex items-center gap-3">
                    <img 
                        src="https://res.cloudinary.com/dd36u8rxp/image/upload/v1773159321/ghar_gaon_logo1_lfkhw2.png" 
                        alt="Ghar Gaon Logo" 
                        className="h-10 w-auto object-contain hover:scale-105 transition-transform duration-300"
                    />
                    <span className="text-2xl font-bold font-display tracking-tight text-white">Ghar Gaon</span>
                </div>
                <p className="text-gray-400 text-sm leading-relaxed">
                    Bringing the authentic taste of Indian villages to modern urban homes. Healthy, fresh, and handmade with absolute love.
                </p>
                
                {/* Brand Social links */}
                <div className="flex gap-3 mt-2">
                    <a 
                        href="https://www.instagram.com/ghargaon.in" 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="w-10 h-10 rounded-xl bg-gray-800 hover:bg-primary/20 flex items-center justify-center text-gray-400 hover:text-primary border border-gray-800 hover:border-primary/30 transition-all duration-300 active:scale-95"
                    >
                        <Instagram size={18} />
                    </a>
                    <a 
                        href="https://wa.me/919363969630" 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="w-10 h-10 rounded-xl bg-gray-800 hover:bg-veg/20 flex items-center justify-center text-gray-400 hover:text-veg border border-gray-800 hover:border-veg/30 transition-all duration-300 active:scale-95"
                    >
                        <svg className="w-[18px] h-[18px] fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.456 5.705 1.458h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                        </svg>
                    </a>
                </div>
            </div>

            {/* Column 2: Quick Links */}
            <div>
                <h4 className="font-bold text-lg mb-6 text-white tracking-wide">Quick Links</h4>
                <ul className="space-y-4 text-gray-400 text-sm">
                    {["Daily Menu", "Subscriptions"].map((item, i) => (
                        <li key={i}>
                            <a href="/subscription/plans" className="hover:text-primary hover:translate-x-1 inline-block transition-all duration-300">
                                {item}
                            </a>
                        </li>
                    ))}
                </ul>
            </div>

            {/* Column 3: Support */}
            <div>
                <h4 className="font-bold text-lg mb-6 text-white tracking-wide">Support</h4>
                <ul className="space-y-4 text-gray-400 text-sm">
                    <li>
                        <a
                            href="https://docs.google.com/document/d/1h70ObO1iUd0sZrLt_mQy4veA_QL4oD-ppH9LhRa8POk/edit?usp=sharing"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-primary hover:translate-x-1 inline-block transition-all duration-300"
                        >
                            Help Center
                        </a>
                    </li>
                    <li>
                        <a
                            href="https://docs.google.com/document/d/1hGx6CmU0pHqKJ_fGrGj3G1TfPBAw_wLNy9sdo0rAqOw/edit?usp=sharing"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-primary hover:translate-x-1 inline-block transition-all duration-300"
                        >
                            Delivery Areas
                        </a>
                    </li>
                    <li>
                        <a
                            href="https://docs.google.com/document/d/1sttupkYJTUoTNmOqcIt-S7fy7BgRVcWUC6xm6JYR3as/edit?usp=sharing"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-primary hover:translate-x-1 inline-block transition-all duration-300"
                        >
                            Terms of Service
                        </a>
                    </li>
                    <li>
                        <a
                            href="https://docs.google.com/document/d/1kKdYpb1gq7m4V-F3dms-h_Bv-Zz6D8DvjL38_3KVPmg/edit?usp=sharing"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-primary hover:translate-x-1 inline-block transition-all duration-300"
                        >
                            Refund Policy
                        </a>
                    </li>
                </ul>
            </div>

            {/* Column 4: Contact Us */}
            <div>
                <h4 className="font-bold text-lg mb-6 text-white tracking-wide">Contact Us</h4>
                <ul className="space-y-4">
                    {/* Clickable Email Action */}
                    <li>
                        <a 
                            href="mailto:hello@ghargaon.in" 
                            className="flex items-center gap-3 text-gray-400 hover:text-primary transition-all group"
                        >
                            <div className="w-9 h-9 rounded-xl bg-gray-800/60 group-hover:bg-primary/20 flex items-center justify-center text-gray-400 group-hover:text-primary border border-gray-800/80 group-hover:border-primary/30 transition-all">
                                <Mail size={16} />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] text-gray-500 uppercase tracking-widest leading-none mb-1">Email Us</span>
                                <span className="text-sm font-semibold text-gray-300 group-hover:text-white transition-colors">hello@ghargaon.in</span>
                            </div>
                        </a>
                    </li>

                    {/* Clickable WhatsApp Action */}
                    <li>
                        <a 
                            href="https://wa.me/919363969630" 
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 text-gray-400 hover:text-veg transition-all group"
                        >
                            <div className="w-9 h-9 rounded-xl bg-gray-800/60 group-hover:bg-veg/20 flex items-center justify-center text-gray-400 group-hover:text-veg border border-gray-800/80 group-hover:border-veg/30 transition-all">
                                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.456 5.705 1.458h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                                </svg>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] text-gray-500 uppercase tracking-widest leading-none mb-1">WhatsApp Us</span>
                                <span className="text-sm font-semibold text-gray-300 group-hover:text-white transition-colors">+91 9363969630</span>
                            </div>
                        </a>
                    </li>

                    {/* Clickable Calling Action */}
                    <li>
                        <a 
                            href="tel:+919363969630" 
                            className="flex items-center gap-3 text-gray-400 hover:text-accent transition-all group"
                        >
                            <div className="w-9 h-9 rounded-xl bg-gray-800/60 group-hover:bg-accent/20 flex items-center justify-center text-gray-400 group-hover:text-accent border border-gray-800/80 group-hover:border-accent/30 transition-all">
                                <Phone size={14} />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] text-gray-500 uppercase tracking-widest leading-none mb-1">Call Us</span>
                                <span className="text-sm font-semibold text-gray-300 group-hover:text-white transition-colors">+91 9363969630</span>
                            </div>
                        </a>
                    </li>
                </ul>
            </div>
        </div>

        {/* Bottom Bar */}
        <div className="max-w-7xl mx-auto pt-8 flex flex-col md:flex-row justify-between items-center text-xs text-gray-500 gap-4">
            <div>
                <p>© 2026 Ghar Gaon. All rights reserved.</p>
                <p>Display Name: GharGaon</p>
                <p>Legal Name: Manish</p>
            </div>
            <div className="flex items-center gap-1">
                <span>Made with</span>
                <span className="text-red-500 animate-pulse">❤️</span>
                <span>in India</span>
            </div>
        </div>
    </footer>
);




export {
    MenuSection,
    MenuIcon,
    Footer,
    Testimonials,
    HowItWorks,
    DetailedMenu,
    SubscriptionSection,
}