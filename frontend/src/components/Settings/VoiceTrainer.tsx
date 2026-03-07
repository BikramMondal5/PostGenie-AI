import React, { useState, useEffect } from 'react';
import {
    Sparkles,
    RefreshCw,
    Info,
    Twitter,
    Linkedin,
    Instagram,
    Facebook,
    Lock,
    Trash2,
    Clock,
    Calendar,
    Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';
import { ResponseModal } from '@/components/ui/ResponseModal';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';

interface VoiceProfile {
    profileId: string;
    platform: string;
    systemInstruction: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

const VoiceTrainer: React.FC = () => {
    const [activePlatform, setActivePlatform] = useState<string | null>(null);
    const [connectedPlatforms, setConnectedPlatforms] = useState<string[]>([]);
    const [instructions, setInstructions] = useState<Record<string, string>>({
        linkedin: "",
        twitter: "",
        instagram: "",
        facebook: ""
    });
    const [profiles, setProfiles] = useState<VoiceProfile[]>([]);
    const [isSaving, setIsSaving] = useState<Record<string, boolean>>({});
    const [isToggling, setIsToggling] = useState<string | null>(null);
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
            if (connected.length > 0 && !activePlatform) {
                setActivePlatform(connected[0]);
            }

            setProfiles(profilesData.profiles || []);

            // Set current instructions based on the active platform's active profile
            const newInstructions: Record<string, string> = {
                linkedin: "",
                twitter: "",
                instagram: "",
                facebook: ""
            };

            // Set initial instructions from active profile per platform
            profilesData.profiles?.forEach((p: VoiceProfile) => {
                if (p.isActive) {
                    newInstructions[p.platform] = p.systemInstruction || "";
                }
            });
            setInstructions(prev => ({ ...prev, ...newInstructions }));

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
        if (!instructions[platform].trim()) {
            showResponse("Empty Instruction", "Please enter some instructions before saving.", "error");
            return;
        }

        setIsSaving(prev => ({ ...prev, [platform]: true }));
        try {
            await api.post('/voice/train', {
                platform,
                systemInstruction: instructions[platform]
            });
            showResponse("Profile Created", `A new voice instruction set for ${platformConfig[platform]?.name} has been created and activated.`, "success");
            await fetchData(); // Refresh list
        } catch (error: any) {
            console.error("Save Error:", error);
            showResponse("Save Failed", "Failed to create profile: " + error.message, "error");
        } finally {
            setIsSaving(prev => ({ ...prev, [platform]: false }));
        }
    };

    const handleToggleActive = async (profileId: string, platform: string, currentStatus: boolean) => {
        setIsToggling(profileId);
        try {
            await api.patch(`/voice/profiles/${profileId}`, {
                platform,
                isActive: !currentStatus
            });
            await fetchData(); // Refresh
        } catch (error: any) {
            console.error("Toggle Error:", error);
            showResponse("Action Failed", "Failed to toggle status: " + error.message, "error");
        } finally {
            setIsToggling(null);
        }
    };

    const handleDeleteProfile = async (profileId: string) => {
        if (!confirm("Are you sure you want to delete this voice instruction?")) return;

        try {
            await api.delete(`/voice/profiles/${profileId}`);
            setProfiles(prev => prev.filter(p => p.profileId !== profileId));
            showResponse("Deleted", "Voice instruction removed from history.", "success");
        } catch (error: any) {
            console.error("Delete Error:", error);
            showResponse("Delete Failed", error.message, "error");
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
                <RefreshCw className="w-10 h-10 text-pink-500 animate-spin mb-4" />
                <p className="text-gray-500 font-medium">Loading your voice studio...</p>
            </div>
        );
    }

    return (
        <div className="max-w-4xl space-y-8 sm:space-y-12">
            <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-50 text-pink-600 text-[10px] font-bold uppercase tracking-widest mb-3">
                    <Sparkles className="w-3 h-3" />
                    Style Customization
                </div>
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-gray-900 tracking-tight">Fine-Tune Your Voice</h2>
                <p className="text-gray-500 mt-2 text-sm sm:text-base md:text-lg max-w-2xl">Define specific personas, tones, and formatting rules. Your instructions act as a blueprint for the AI.</p>
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
                <>
                    <div className="space-y-6 sm:space-y-8">
                        {/* Platform Tabs */}
                        <div className="flex flex-wrap gap-2 p-1.5 bg-gray-100/50 rounded-[2rem] border border-gray-100 w-full sm:w-fit backdrop-blur-sm">
                            {connectedPlatforms.map((p) => {
                                const config = platformConfig[p];
                                const Icon = config?.icon || Info;
                                const isActive = activePlatform === p;

                                return (
                                    <button
                                        key={p}
                                        onClick={() => setActivePlatform(p)}
                                        className={cn(
                                            "flex items-center gap-1.5 sm:gap-2.5 px-3 sm:px-6 py-2 sm:py-3 rounded-[1.5rem] font-bold text-xs sm:text-sm transition-all duration-300 flex-1 sm:flex-initial justify-center",
                                            isActive
                                                ? "bg-white text-pink-600 shadow-md border border-pink-50"
                                                : "text-gray-500 hover:text-gray-700 hover:bg-white/50"
                                        )}
                                    >
                                        <Icon className={cn("w-3 h-3 sm:w-4 sm:h-4", isActive ? config?.color : "text-gray-400")} />
                                        <span className="hidden xs:inline">{config?.name || p}</span>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Creative Input Section */}
                        {activePlatform && (
                            <div className="bg-white border border-gray-100 rounded-[2rem] sm:rounded-[3rem] shadow-xl shadow-pink-500/5 overflow-hidden group">
                                <div className="p-4 sm:p-6 md:p-10">
                                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 sm:mb-8">
                                        <div className="flex items-center gap-3 sm:gap-5">
                                            <div className={cn("p-3 sm:p-5 rounded-[1.5rem] shadow-sm", platformConfig[activePlatform]?.bgColor || "bg-gray-50")}>
                                                {React.createElement(platformConfig[activePlatform]?.icon || Info, {
                                                    className: cn("w-5 h-5 sm:w-8 sm:h-8", platformConfig[activePlatform]?.color || "text-gray-600")
                                                })}
                                            </div>
                                            <div>
                                                <h3 className="text-lg sm:text-2xl font-black text-gray-900 tracking-tight">
                                                    New {platformConfig[activePlatform]?.name} Persona
                                                </h3>
                                                <p className="text-xs sm:text-sm text-gray-500 font-medium">Create a new instruction set for this platform</p>
                                            </div>
                                        </div>
                                        <Button
                                            onClick={() => handleSaveInstruction(activePlatform)}
                                            disabled={isSaving[activePlatform]}
                                            className="bg-pink-500 hover:bg-pink-600 text-white rounded-2xl px-4 sm:px-8 h-11 sm:h-14 font-bold shadow-md shadow-pink-200/50 transition-all flex items-center gap-2 sm:gap-3 transform hover:scale-105 w-full sm:w-auto text-sm sm:text-base"
                                        >
                                            {isSaving[activePlatform] ? (
                                                <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                                            ) : (
                                                <Zap className="w-4 h-4 sm:w-5 sm:h-5 fill-white" />
                                            )}
                                            Save & Activate
                                        </Button>
                                    </div>

                                    <div className="relative group/text">
                                        <div className="absolute top-5 left-6 z-10 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/80 backdrop-blur-md border border-gray-100 text-[10px] font-black text-pink-500 uppercase tracking-widest shadow-sm">
                                            <Sparkles className="w-3.5 h-3.5" />
                                            LLM System Instruction
                                        </div>
                                        <Textarea
                                            placeholder={`e.g., "Write like an industry expert who is also accessible. Use witty metaphors. Limit to 3 short paragraphs. Include a 'Key Takeaway' section at the end."`}
                                            value={instructions[activePlatform] || ""}
                                            onChange={(e) => setInstructions(prev => ({ ...prev, [activePlatform]: e.target.value }))}
                                            className="min-h-[250px] bg-gray-50/50 border-gray-100 focus:border-pink-300 focus:ring-pink-50 rounded-[2.5rem] text-base leading-relaxed p-10 pt-16 transition-all group-hover:bg-white resize-none"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Voice History Section */}
                    <div className="space-y-6 pt-6">
                        <div className="flex items-center justify-between px-2">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-gray-100 rounded-xl">
                                    <Clock className="w-5 h-5 text-gray-600" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black text-gray-900 tracking-tight">Voice History</h3>
                                    <p className="text-sm text-gray-400 font-medium">Reuse and switch between your saved personas</p>
                                </div>
                            </div>
                            <Badge variant="outline" className="rounded-full px-4 py-1.5 border-gray-200 text-gray-500 font-bold">
                                {profiles.length} Saved Profiles
                            </Badge>
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                            {profiles.length === 0 ? (
                                <div className="text-center py-16 bg-gray-50/50 rounded-[2.5rem] border border-dashed border-gray-200">
                                    <Calendar className="w-10 h-10 text-gray-300 mx-auto mb-4" />
                                    <p className="text-gray-400 font-medium">Your voice history is empty. Save your first instruction set above!</p>
                                </div>
                            ) : (
                                [...profiles].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map((profile) => {
                                    const config = platformConfig[profile.platform];
                                    const Icon = config?.icon || Info;

                                    return (
                                        <div
                                            key={profile.profileId}
                                            className={cn(
                                                "group relative bg-white border rounded-[2rem] p-6 transition-all duration-300 hover:shadow-lg hover:shadow-gray-200/50",
                                                profile.isActive ? "border-pink-200 bg-pink-50/10 shadow-sm shadow-pink-100" : "border-gray-100"
                                            )}
                                        >
                                            <div className="flex items-start justify-between gap-6">
                                                <div className="flex items-start gap-5 flex-1">
                                                    <div className={cn("p-3.5 rounded-2xl shadow-sm", config?.bgColor || "bg-gray-50", profile.isActive ? "ring-2 ring-pink-100" : "")}>
                                                        <Icon className={cn("w-6 h-6", config?.color || "text-gray-600")} />
                                                    </div>
                                                    <div className="space-y-2 flex-1">
                                                        <div className="flex items-center gap-3">
                                                            <span className="text-xs font-black uppercase tracking-wider text-gray-400">
                                                                {config?.name || profile.platform}
                                                            </span>
                                                            <div className="w-1 h-1 rounded-full bg-gray-200" />
                                                            <span className="text-xs font-bold text-gray-400 flex items-center gap-1">
                                                                <Calendar className="w-3 h-3" />
                                                                {new Date(profile.createdAt).toLocaleDateString(undefined, {
                                                                    month: 'short',
                                                                    day: 'numeric',
                                                                    year: 'numeric'
                                                                })}
                                                            </span>
                                                        </div>
                                                        <p className="text-sm text-gray-600 leading-relaxed font-medium line-clamp-2 italic">
                                                            "{profile.systemInstruction}"
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-6 self-center">
                                                    <div className="flex flex-col items-end gap-1.5">
                                                        <span className={cn("text-[10px] font-black uppercase tracking-widest", profile.isActive ? "text-pink-600" : "text-gray-400")}>
                                                            {profile.isActive ? "Active Persona" : "Disabled"}
                                                        </span>
                                                        <Switch
                                                            checked={profile.isActive}
                                                            disabled={isToggling === profile.profileId}
                                                            onCheckedChange={() => handleToggleActive(profile.profileId, profile.platform, profile.isActive)}
                                                        />
                                                    </div>

                                                    <div className="w-px h-10 bg-gray-100" />

                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleDeleteProfile(profile.profileId)}
                                                        className="rounded-xl text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all"
                                                    >
                                                        <Trash2 className="w-5 h-5" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </>
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
