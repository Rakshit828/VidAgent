import { motion, AnimatePresence } from 'framer-motion';
import { Video } from 'lucide-react';

interface FullScreenLoaderProps {
    isVisible: boolean;
    label?: string;
}

/**
 * A premium, glassmorphic full-screen loader designed to wow the user.
 * Uses framer-motion for smooth entry/exit and a pulsing logo animation.
 */
export const FullScreenLoader = ({ isVisible, label = "Processing..." }: FullScreenLoaderProps) => {
    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-100 flex flex-col items-center justify-center bg-background/60 backdrop-blur-md"
                >
                    <div className="relative">
                        {/* Outer rotating ring */}
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                            className="w-24 h-24 rounded-full border-2 border-t-primary border-r-transparent border-b-purple-600 border-l-transparent shadow-[0_0_15px_rgba(var(--primary),0.3)]"
                        />

                        {/* Inner Pulsing Logo */}
                        <motion.div
                            initial={{ scale: 0.8 }}
                            animate={{ scale: [0.8, 1.1, 0.8] }}
                            transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                            className="absolute inset-0 flex items-center justify-center text-primary"
                        >
                            <Video className="w-10 h-10" />
                        </motion.div>
                    </div>

                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="mt-6 flex flex-col items-center"
                    >
                        <span className="text-lg font-bold tracking-widest uppercase bg-linear-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                            {label}
                        </span>
                        <div className="mt-2 flex gap-1">
                            {[0, 1, 2].map((i) => (
                                <motion.div
                                    key={i}
                                    animate={{ opacity: [0.3, 1, 0.3] }}
                                    transition={{ repeat: Infinity, duration: 1, delay: i * 0.2 }}
                                    className="w-1.5 h-1.5 rounded-full bg-primary"
                                />
                            ))}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
