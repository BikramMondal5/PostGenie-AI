import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, XCircle, Info, X } from "lucide-react";
import { Button } from "./button";

export interface ResponseModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    message: string;
    type?: "success" | "error" | "info";
}

export const ResponseModal: React.FC<ResponseModalProps> = ({
    isOpen,
    onClose,
    title,
    message,
    type = "info",
}) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
                    />

                    {/* Modal Container */}
                    <div className="fixed inset-0 z-[10000] flex items-center justify-center pointer-events-none p-4">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="bg-white border border-gray-100 rounded-3xl shadow-[0_20px_50px_rgba(236,72,153,0.15)] w-full max-w-sm overflow-hidden pointer-events-auto"
                        >
                            {/* Header with Color Bar */}
                            <div
                                className={`h-2 w-full ${type === "success"
                                    ? "bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                                    : type === "error"
                                        ? "bg-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.3)]"
                                        : "bg-pink-500 shadow-[0_0_15px_rgba(236,72,153,0.3)]"
                                    }`}
                            />

                            <div className="p-8">
                                <div className="flex items-start justify-between mb-6">
                                    <div className="flex items-center gap-4">
                                        <div className={`p-3 rounded-2xl ${type === "success"
                                            ? "bg-emerald-50 text-emerald-600"
                                            : type === "error"
                                                ? "bg-rose-50 text-rose-600"
                                                : "bg-pink-50 text-pink-600"
                                            }`}>
                                            {type === "success" && <CheckCircle2 className="w-6 h-6" />}
                                            {type === "error" && <XCircle className="w-6 h-6" />}
                                            {type === "info" && <Info className="w-6 h-6" />}
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-gray-900 tracking-tight leading-none">
                                                {title}
                                            </h3>
                                        </div>
                                    </div>
                                    <button
                                        onClick={onClose}
                                        className="text-gray-400 hover:text-gray-900 transition-colors p-2 hover:bg-gray-50 rounded-xl"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                <p className="text-gray-600 leading-relaxed mb-8 text-sm font-medium">
                                    {message}
                                </p>

                                <div className="flex justify-end">
                                    <Button
                                        onClick={onClose}
                                        className={`px-8 h-12 rounded-2xl font-bold transition-all duration-300 border-0 ${type === "success"
                                            ? "bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-200 text-white"
                                            : type === "error"
                                                ? "bg-rose-600 hover:bg-rose-700 shadow-lg shadow-rose-200 text-white"
                                                : "bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 shadow-lg shadow-pink-200 text-white"
                                            }`}
                                    >
                                        Continue
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
};
