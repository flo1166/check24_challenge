import React, { useEffect, useState } from "react";
import {
  Shield, CreditCard, Zap, Wifi, Smartphone,
  Globe2, Plane, Hotel, Car, Lock
} from "lucide-react";

export default function CategoryNav({ onSelect, activeCategory, badges = {} }) {
  const categories = [
    { id: "versicherung", icon: Shield, label: "Versicherungen" },
    { id: "konto", icon: CreditCard, label: "Konto & Kredit" },
    { id: "stromgas", icon: Zap, label: "Strom & Gas" },
    { id: "internet", icon: Wifi, label: "Internet" },
    { id: "handy", icon: Smartphone, label: "Handy" },
    { id: "reise", icon: Globe2, label: "Reise" },
    { id: "fluege", icon: Plane, label: "Flüge" },
    { id: "hotels", icon: Hotel, label: "Hotel & Ferienwohnung" },
    { id: "mietwagen", icon: Car, label: "Mietwagen" },
  ];

  // Track which categories just unlocked
  const [justUnlocked, setJustUnlocked] = useState({});

  // Detect unlock transitions
  useEffect(() => {
    const updated = {};
    for (const cat of categories) {
      const isLocked = badges?.[cat.id]?.locked;

      if (justUnlocked[cat.id] === undefined) {
        // initialize (store initial lock state)
        updated[cat.id] = isLocked;
      } else {
        // detect if unlocked now
        if (justUnlocked[cat.id] === true && isLocked === false) {
          updated[cat.id] = "glow"; // trigger glow
          setTimeout(() => {
            setJustUnlocked((prev) => ({ ...prev, [cat.id]: false }));
          }, 1300);
        } else {
          updated[cat.id] = isLocked;
        }
      }
    }
    setJustUnlocked(updated);
  }, [badges]);

  return (
    <div className="flex flex-wrap justify-center gap-4 mt-10">
      {categories.map((cat) => {
        const Icon = cat.icon;
        const entry = badges[cat.id] || {};
        const locked = entry.locked;
        const count = entry.count || 0;
        const doGlow = justUnlocked[cat.id] === "glow";

        return (
          <button
            key={cat.id}
            disabled={locked}
            onClick={() => !locked && onSelect?.(cat.id)}
            className={`
              relative flex items-center gap-3 px-6 py-4 rounded-c24-sm shadow-md border 
              transition transform
              ${
                locked
                  ? "bg-gray-400/30 border-gray-300/20 cursor-not-allowed opacity-50 backdrop-blur"
                  : "bg-gradient-to-r from-c24-primary-deep to-c24-primary-medium hover:scale-[1.03] border-white/10"
              }
              ${activeCategory === cat.id && !locked ? "ring-2 ring-white" : ""}
              ${doGlow ? "animate-glow" : ""}
            `}
          >
            {/* Locked overlay */}
            {locked && (
              <div className="absolute inset-0 bg-black/20 flex items-center justify-center rounded-c24-sm">
                <Lock className="w-6 h-6 text-white/70" />
              </div>
            )}

            {/* Badge */}
            {count > 0 && !locked && (
              <span className="absolute -top-2 -right-2 flex items-center justify-center 
                               w-5 h-5 bg-red-600 text-white text-xs rounded-full shadow">
                {count}
              </span>
            )}

            <Icon className={`w-6 h-6 ${locked ? "text-white/40" : "text-white/70"}`} />
            <span className={`font-medium ${locked ? "text-white/40" : "text-white"}`}>
              {cat.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
