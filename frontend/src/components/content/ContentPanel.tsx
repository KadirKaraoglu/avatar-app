"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useUIStore } from "@/lib/store/uiStore";

export default function ContentPanel() {
    const { isContentVisible } = useUIStore();

    return (
        <AnimatePresence>
            {isContentVisible && (
                <motion.div
                    initial={{ x: "-100%", opacity: 0 }}
                    animate={{ x: "0%", opacity: 1 }}
                    exit={{ x: "-100%", opacity: 0 }}
                    transition={{ type: "spring", stiffness: 100, damping: 20 }}
                    className="absolute top-0 left-0 w-1/2 h-full bg-white z-20 p-12 flex flex-col justify-center shadow-2xl shadow-gray-100/50 border-r border-gray-50"
                >
                    <div className="w-full h-full rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center">
                        <span className="text-gray-400 font-light">Dynamic Content Area (Map/Video)</span>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
