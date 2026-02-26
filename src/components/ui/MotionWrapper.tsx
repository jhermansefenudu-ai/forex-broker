"use client";
import React from "react";
import { motion, Variants, TargetAndTransition } from "framer-motion";

interface MotionWrapperProps {
    children: React.ReactNode;
    className?: string;
    delay?: number;
    direction?: "up" | "down" | "left" | "right" | "none";
}

export const MotionWrapper: React.FC<MotionWrapperProps> = ({
    children,
    className,
    delay = 0,
    direction = "up",
}) => {
    const getVariants = (): Variants => {
        const distance = 20;
        const initial: TargetAndTransition = { opacity: 0, y: 0, x: 0 };

        switch (direction) {
            case "up": initial.y = distance; break;
            case "down": initial.y = -distance; break;
            case "left": initial.x = distance; break;
            case "right": initial.x = -distance; break;
            case "none": break;
        }

        return {
            hidden: initial,
            visible: {
                opacity: 1,
                y: 0,
                x: 0,
                transition: {
                    duration: 0.5,
                    delay: delay
                }
            },
        };
    };

    return (
        <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={getVariants()}
            className={className}
        >
            {children}
        </motion.div>
    );
};
