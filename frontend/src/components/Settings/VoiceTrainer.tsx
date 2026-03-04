import React, { useState } from 'react';
import {
    Wand2,
    Sparkles,
    Trash2,
    RefreshCw,
    Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

const VoiceTrainer: React.FC = () => {
    const [trainingPlatform, setTrainingPlatform] = useState<"twitter" | "linkedin" | "instagram">("linkedin");
    const [pastedPosts, setPastedPosts] = useState("");
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    const handleTrainVoice = async () => {
        if (!pastedPosts.trim()) return;
        setIsAnalyzing(true);
        await new Promise(resolve => setTimeout(resolve, 2000));
        console.log("Analyzing voice for", trainingPlatform, ":", pastedPosts);
        setIsAnalyzing(false);
        setPastedPosts("");
        alert("Voice Profile Updated! PostGenie now knows your style.");
    };

    return (
        <div className="max-w-3xl">
            <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900">Train Your AI Voice</h2>
                <p className="text-gray-500 mt-1">Help PostGenie learn your unique writing style, tone, and vocabulary.</p>
            </div>

            <div className="space-y-8">
                <section className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                    <div className="flex items-start gap-3 mb-6">
                        <div className="p-2 bg-pink-100 rounded-lg shrink-0">
                            <Info className="w-4 h-4 text-pink-600" />
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-gray-900">How it works</h4>
                            <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                                PostGenie analyzes your past content to extract patterns like adjective frequency, sentence structure, and hashtag usage. Paste 3-5 high-performing posts for the best results.
                            </p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <Label className="text-xs font-bold uppercase tracking-wider text-gray-500">Select Platform Context</Label>
                            <div className="flex gap-2 p-1 bg-white rounded-lg border border-gray-200">
                                {(['linkedin', 'twitter', 'instagram'] as const).map((p) => (
                                    <button
                                        key={p}
                                        onClick={() => setTrainingPlatform(p)}
                                        className={cn(
                                            "px-4 py-1.5 text-xs font-bold rounded-md capitalize transition-all",
                                            trainingPlatform === p
                                                ? "bg-pink-600 text-white shadow-md"
                                                : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                                        )}
                                    >
                                        {p}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="relative">
                            <Textarea
                                placeholder={`Paste your past ${trainingPlatform} posts here...`}
                                value={pastedPosts}
                                onChange={(e) => setPastedPosts(e.target.value)}
                                className="min-h-[250px] bg-white border-gray-200 focus:ring-pink-100 text-sm leading-relaxed p-6"
                            />
                            <div className="absolute bottom-4 right-4 text-[10px] font-bold text-gray-400">
                                {pastedPosts.length} characters
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <Button
                                className="flex-1 bg-pink-600 hover:bg-pink-700 text-white h-12 shadow-lg shadow-pink-100"
                                onClick={handleTrainVoice}
                                disabled={!pastedPosts.trim() || isAnalyzing}
                            >
                                {isAnalyzing ? (
                                    <><RefreshCw className="w-5 h-5 mr-2 animate-spin" /> Analyzing Your Style...</>
                                ) : (
                                    <><Sparkles className="w-5 h-5 mr-2" /> Update Voice Profile</>
                                )}
                            </Button>
                            <Button
                                variant="outline"
                                size="icon"
                                className="h-12 w-12 border-gray-200 hover:bg-red-50 hover:text-red-600 hover:border-red-100"
                                onClick={() => setPastedPosts("")}
                            >
                                <Trash2 className="w-5 h-5" />
                            </Button>
                        </div>
                    </div>
                </section>

                <section>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-4">Training History</h3>
                    <div className="border border-gray-100 rounded-2xl overflow-hidden">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 text-gray-600 uppercase text-[10px] font-bold tracking-widest">
                                <tr>
                                    <th className="px-6 py-3">Platform</th>
                                    <th className="px-6 py-3">Last Updated</th>
                                    <th className="px-6 py-3">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                <tr>
                                    <td className="px-6 py-4 font-semibold text-gray-900 capitalize">LinkedIn</td>
                                    <td className="px-6 py-4 text-gray-500">March 04, 2024</td>
                                    <td className="px-6 py-4 text-green-600 font-bold flex items-center gap-2">
                                        <CheckCircle2 className="w-4 h-4" /> Ready
                                    </td>
                                </tr>
                                <tr>
                                    <td className="px-6 py-4 font-semibold text-gray-900 capitalize">Twitter</td>
                                    <td className="px-6 py-4 text-gray-500">March 02, 2024</td>
                                    <td className="px-6 py-4 text-green-600 font-bold flex items-center gap-2">
                                        <CheckCircle2 className="w-4 h-4" /> Ready
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>
        </div>
    );
};

// Internal components to keep it clean
const Label = ({ children, className }: { children: React.ReactNode, className?: string }) => (
    <label className={cn("block", className)}>{children}</label>
);

const CheckCircle2 = ({ className }: { className?: string }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
);

export default VoiceTrainer;
