import React, { useState, useEffect } from 'react';
import {
    Sparkles,
    RefreshCw,
    Info,
    Twitter,
    Linkedin,
    Instagram,
    Facebook,
    Save,
    CheckCircle2,
    Lock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';
import { ResponseModal } from '@/components/ui/ResponseModal';
import { Badge } from '@/components/ui/badge';

const VoiceTrainer: React.FC = () => {
    const [activePlatform, setActivePlatform] = useState<string | null>(null);
    const [connectedPlatforms, setConnectedPlatforms] = useState<string[]>([]);
    const [instructions, setInstructions] = useState<Record<string, string>>({
        linkedin: "",
        twitter: "",
        instagram: "",
        facebook: ""
    });
    const [isSaving, setIsSaving] = useState<Record<string, boolean>>({});
    const [loading, setLoading] = useState(true);
    const [modalState, setModalState] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        type: "success" | "error" | "info";
    }>({
        isOpen: false,
        title: "",
        message: "",
        type: "info",
    });

    const platformConfig: Record<string, any> = {
        linkedin: { name: 'LinkedIn', icon: Linkedin, color: 'text-blue-600', bgColor: 'bg-blue-50' },
        twitter: { name: 'X / Twitter', icon: Twitter, color: 'text-black', bgColor: 'bg-black/5' },
        instagram: { name: 'Instagram', icon: Instagram, color: 'text-pink-600', bgColor: 'bg-pink-50' },
        facebook: { name: 'Facebook', icon: Facebook, color: 'text-blue-700', bgColor: 'bg-blue-50' },
    };

    const showResponse = (title: string, message: string, type: "success" | "error" | "info" = "info") => {
        setModalState({ isOpen: true, title, message, type });
    };

    const fetchData = async () => {
        try {
            setLoading(true);
            const [connectionsData, profilesData] = await Promise.all([
                api.get('/oauth/connections'),
                api.get('/voice/profiles')
            ]);

            const connected = connectionsData.connections
                .map((c: any) => c.platform)
                .filter((p: string) => platformConfig.hasOwnProperty(p));

            setConnectedPlatforms(connected);
            if (connected.length > 0) {
                setActivePlatform(connected[0]);
            }

            const initialInstructions: Record<string, string> = {
                linkedin: "",
                twitter: "",
                instagram: "",
                facebook: ""
            };
            profilesData.profiles.forEach((p: any) => {
                if (initialInstructions.hasOwnProperty(p.platform)) {
                    initialInstructions[p.platform] = p.systemInstruction || "";
                }
            });
            setInstructions(initialInstructions);
        } catch (error) {
            console.error("Failed to fetch data:", error);
            showResponse("Error", "Failed to load voice profiles and connections.", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleSaveInstruction = async (platform: string) => {
        setIsSaving(prev => ({ ...prev, [platform]: true }));
        try {
            await api.post('/voice/train', {
                platform,
                systemInstruction: instructions[platform]
            });
            showResponse("Settings Saved", `Custom voice instructions for ${platformConfig[platform]?.name || platform} updated successfully.`, "success");
        } catch (error: any) {
            console.error("Save Error:", error);
            showResponse("Save Failed", "Failed to update instructions: " + error.message, "error");
        } finally {
            setIsSaving(prev => ({ ...prev, [platform]: false }));
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
                <RefreshCw className="w-10 h-10 text-pink-500 animate-spin mb-4" />
                <p className="text-gray-500 font-medium">Loading your voice profiles...</p>
            </div>
        );
    }

    return (
        <div className="max-w-4xl">
            <div className="mb-10">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-50 text-pink-600 text-[10px] font-bold uppercase tracking-widest mb-3">
                    <Sparkles className="w-3 h-3" />
                    Style Customization
                </div>
                <h2 className="text-3xl font-black text-gray-900 tracking-tight">Fine-Tune Your Voice</h2>
                <p className="text-gray-500 mt-2 text-lg">Define specific personas, tones, and formatting rules for each of your connected platforms.</p>
            </div>

            {connectedPlatforms.length === 0 ? (
                <div className="bg-amber-50 border border-amber-100 rounded-3xl p-10 text-center">
                    <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <Lock className="w-8 h-8 text-amber-600" />
                    </div>
                    <h3 className="text-xl font-bold text-amber-900 mb-2">No Platforms Connected</h3>
                    <p className="text-amber-800/70 max-w-md mx-auto mb-8 font-medium">
                        You need to connect at least one social media account to customize your AI voice.
                    </p>
                    <Button
                        onClick={() => window.location.href = '/settings/integrations'}
                        className="bg-amber-600 hover:bg-amber-700 text-white rounded-2xl px-8 h-12 font-bold shadow-lg shadow-amber-200"
                    >
                        Go to Integrations
                    </Button>
                </div>
            ) : (
                <div className="space-y-8">
                    {/* Platform Tabs */}
                    <div className="flex flex-wrap gap-3 p-1.5 bg-gray-50 rounded-[2rem] border border-gray-100 w-fit">
                        {connectedPlatforms.map((p) => {
                            const config = platformConfig[p];
                            const Icon = config?.icon || Info;
                            const isActive = activePlatform === p;

                            return (
                                <button
                                    key={p}
                                    onClick={() => setActivePlatform(p)}
                                    className={cn(
                                        "flex items-center gap-2.5 px-6 py-3 rounded-[1.5rem] font-bold text-sm transition-all duration-300",
                                        isActive
                                            ? "bg-white text-pink-600 shadow-sm border border-pink-100"
                                            : "text-gray-500 hover:text-gray-700 hover:bg-white/50"
                                    )}
                                >
                                    <Icon className={cn("w-4 h-4", isActive ? config?.color : "text-gray-400")} />
                                    {config?.name || p}
                                </button>
                            );
                        })}
                    </div>

                    {/* Active Platform Card */}
                    {activePlatform && connectedPlatforms.includes(activePlatform) && (
                        <div key={activePlatform} className="bg-white border border-gray-100 rounded-[2.5rem] shadow-sm hover:shadow-xl hover:shadow-pink-500/5 transition-all duration-300 overflow-hidden group">
                            <div className="p-8">
                                <div className="flex items-center justify-between mb-8">
                                    <div className="flex items-center gap-4">
                                        <div className={cn("p-4 rounded-2xl", platformConfig[activePlatform]?.bgColor || "bg-gray-50")}>
                                            {React.createElement(platformConfig[activePlatform]?.icon || Info, {
                                                className: cn("w-7 h-7", platformConfig[activePlatform]?.color || "text-gray-600")
                                            })}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h3 className="text-xl font-black text-gray-900 tracking-tight">
                                                    {platformConfig[activePlatform]?.name || activePlatform} Voice
                                                </h3>
                                                <Badge variant="secondary" className="bg-green-50 text-green-600 border-green-100 font-bold px-2 py-0">
                                                    Active
                                                </Badge>
                                            </div>
                                            <p className="text-sm text-gray-500 font-medium">Customize how PostGenie writes for this platform</p>
                                        </div>
                                    </div>
                                    <Button
                                        onClick={() => handleSaveInstruction(activePlatform)}
                                        disabled={isSaving[activePlatform]}
                                        className="bg-pink-600 hover:bg-pink-700 text-white rounded-2xl px-6 h-12 font-bold shadow-lg shadow-pink-100 transition-all flex items-center gap-2"
                                    >
                                        {isSaving[activePlatform] ? (
                                            <RefreshCw className="w-5 h-5 animate-spin" />
                                        ) : (
                                            <Save className="w-5 h-5" />
                                        )}
                                        Save Changes
                                    </Button>
                                </div>

                                <div className="relative">
                                    <div className="absolute top-4 left-4 z-10 flex items-center gap-2 px-3 py-1 rounded-lg bg-gray-50/80 backdrop-blur-sm border border-gray-100 text-[10px] font-black text-gray-400 uppercase tracking-widest pointer-events-none">
                                        <Info className="w-3 h-3" />
                                        System Instructions
                                    </div>
                                    <Textarea
                                        placeholder={`e.g., "Write in a sassy, helpful tone. Use 2-3 emojis per post. Focus on actionable tips for small businesses. Keep paragraphs short and use a clear hook at the start."`}
                                        value={instructions[activePlatform] || ""}
                                        onChange={(e) => setInstructions(prev => ({ ...prev, [activePlatform]: e.target.value }))}
                                        className="min-h-[220px] bg-gray-50/30 border-gray-100 focus:border-pink-300 focus:ring-pink-50 rounded-3xl text-sm leading-relaxed p-8 pt-12 transition-all group-hover:bg-white"
                                    />
                                </div>

                                <div className="mt-6 flex items-center gap-6">
                                    <div className="flex items-center gap-2 text-[11px] font-bold text-gray-400">
                                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                        AI Voice Profile Ready
                                    </div>
                                    <div className="flex items-center gap-2 text-[11px] font-bold text-gray-400">
                                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                        Optimized for {platformConfig[activePlatform]?.name}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            <ResponseModal
                isOpen={modalState.isOpen}
                onClose={() => setModalState(prev => ({ ...prev, isOpen: false }))}
                title={modalState.title}
                message={modalState.message}
                type={modalState.type}
            />
        </div>
    );
};

export default VoiceTrainer;
