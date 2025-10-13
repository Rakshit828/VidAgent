import React from "react";
import { motion } from "framer-motion";

// ThreeDotLoader
// Props:
// - size: dot diameter in px (number). Default 10.
// - gap: gap between dots in px (number). Default 8.
// - color: CSS color string. Default 'currentColor'.
// - speed: animation cycle duration in seconds. Default 0.6.
// Usage: <ThreeDotLoader size={12} gap={10} color="#2563eb" speed={0.7} />

export default function ThreeDotLoader({
    size = 10,
    gap = 8,
    color = "currentColor",
    speed = 0.6,
}) {
    const dots = [0, 1, 2];

    return (
        <div
            className="flex items-center justify-center"
            style={{ gap: `${gap}px` }}
            aria-hidden={false}
            role="status"
        >
            {dots.map((i) => (
                <motion.div
                    key={i}
                    initial={{ y: 0, opacity: 0.6 }}
                    animate={{ y: [0, -6, 0], opacity: [0.6, 1, 0.6] }}
                    transition={{
                        duration: speed,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: (i * speed) / 6,
                    }}
                    style={{
                        width: `${size}px`,
                        height: `${size}px`,
                        borderRadius: "9999px",
                        background: color,
                    }}
                />
            ))}

            {/* Accessible hidden label for screen readers */}
            <span className="sr-only">Generating</span>
        </div>
    );
}
