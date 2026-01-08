"use client";

import { motion } from "framer-motion";
import { useUIStore } from "@/lib/store/uiStore";

export default function AvatarContainer() {
    const { isContentVisible } = useUIStore();

    return (
        <motion.div
            initial={false}
            animate={{
                width: isContentVisible ? "50%" : "100%",
                x: isContentVisible ? "50%" : "0%", // Move to right half
            }}
            transition={{ type: "spring", stiffness: 100, damping: 20 }}
            className="absolute top-0 right-0 h-full flex items-center justify-center z-10"
        >
            {/* Placeholder for Avatar Canvas */}
            <div className="relative w-full h-full flex items-center justify-center">
                {/* Visual Indicator for Avatar Position (Dev Only) */}
                <div className="w-[300px] h-[500px] bg-gray-100 rounded-full border border-gray-200 flex items-center justify-center text-gray-400">
                    Avatar Space
                </div>
            </div>
        </motion.div>
    );
}
