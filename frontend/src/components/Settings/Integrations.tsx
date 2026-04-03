import React, { useState, useEffect } from 'react';
import {
    Twitter,
    Linkedin,
    Instagram,
    Facebook,
    CheckCircle2,
    AlertCircle,
    Link2,
    Unlink2,
    RefreshCw
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';
import { ResponseModal } from '@/components/ui/ResponseModal';

const Integrations: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [platforms, setPlatforms] = useState({
        twitter: { connected: false, active: false, lastSynced: null },
        linkedin: { connected: false, active: false, lastSynced: null },
        instagram: { connected: false, active: false, lastSynced: null },
        facebook: { connected: false, active: false, lastSynced: null },
    });

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

    const showResponse = (title: string, message: string, type: "success" | "error" | "info" = "info") => {
        setModalState({ isOpen: true, title, message, type });
    };

    const platformConfig = {
        linkedin: { name: 'LinkedIn', icon: Linkedin, color: 'text-blue-600', bgColor: 'bg-blue-50', status: 'Free' },
        twitter: { name: 'X / Twitter', icon: Twitter, color: 'text-black', bgColor: 'bg-black/5', status: 'Free' },
        instagram: { name: 'Instagram', icon: Instagram, color: 'text-pink-600', bgColor: 'bg-pink-50', status: 'Paid. Need API' },
        facebook: { name: 'Facebook', icon: Facebook, color: 'text-blue-700', bgColor: 'bg-blue-50', status: 'Paid. Need API' },
    };

    const [manualKeys, setManualKeys] = useState<{ [key: string]: { apiKey: string, apiSecret: string } }>({
        twitter: { apiKey: '', apiSecret: '' },
        facebook: { apiKey: '', apiSecret: '' },
        instagram: { apiKey: '', apiSecret: '' }
    });

    const [showManualForm, setShowManualForm] = useState<string | null>(null);

    const handleManualConnect = async (platform: string) => {
        try {
            const keys = (manualKeys as any)[platform];
            await api.post('/oauth/manual', {
                platform,
                ...keys
            });
            setShowManualForm(null);
            await fetchConnections();
            showResponse("Connected", `Successfully connected to ${platform} using API keys.`, "success");
        } catch (error: any) {
            showResponse("Manual Connection Error", 'Failed to connect: ' + error.message, "error");
        }
    };

    const fetchConnections = async () => {
        try {
            const data = await api.get('/oauth/connections');
            const newPlatforms = { ...platforms };

            // Reset connections
            Object.keys(newPlatforms).forEach(key => {
                newPlatforms[key as keyof typeof platforms].connected = false;
            });

            data.connections.forEach((conn: any) => {
                if (newPlatforms[conn.platform as keyof typeof platforms]) {
                    newPlatforms[conn.platform as keyof typeof platforms] = {
                        connected: true,
                        active: conn.isActive,
                        lastSynced: conn.connectedAt
                    };
                }
            });
            setPlatforms(newPlatforms);
        } catch (error) {
            console.error('Failed to fetch connections:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchConnections();
    }, []);

    const handleConnect = async (platform: string) => {
        if (platform === 'linkedin' || platform === 'twitter') {
            try {
                const data = await api.get(`/oauth/initiate?platform=${platform}`);
                if (data.authUrl) {
                    window.location.href = data.authUrl;
                }
            } catch (error: any) {
                showResponse("Connection Error", 'Failed to initiate connection: ' + error.message, "error");
            }
        } else {
            setShowManualForm(prev => prev === platform ? null : platform);
        }
    };

    const handleDisconnect = async (platform: string) => {
        if (!window.confirm(`Are you sure you want to disconnect ${platform}?`)) return;
        try {
            await api.delete(`/oauth/connections/${platform}`);
            await fetchConnections();
            showResponse("Disconnected", `Successfully disconnected from ${platform}.`, "success");
        } catch (error: any) {
            showResponse("Error", 'Failed to disconnect: ' + error.message, "error");
        }
    };

    const handleToggle = async (key: keyof typeof platforms) => {
        if (!platforms[key].connected) return;
        const newActive = !platforms[key].active;
        try {
            // Optimistic update
            setPlatforms(prev => ({
                ...prev,
                [key]: { ...prev[key], active: newActive }
            }));

            // Call API to persist the state
            await api.patch(`/oauth/connections/${key}`, { isActive: newActive });
        } catch (error: any) {
            // Revert on error
            setPlatforms(prev => ({
                ...prev,
                [key]: { ...prev[key], active: !newActive }
            }));
            showResponse("Error", 'Failed to toggle status: ' + error.message, "error");
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-20">
                <RefreshCw className="w-8 h-8 text-pink-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="max-w-3xl text-gray-900">
            <div className="mb-6 sm:mb-10 text-left">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-50 text-pink-600 text-[10px] font-bold uppercase tracking-widest mb-3">
                    <Link2 className="w-3 h-3" />
                    App Integration
                </div>
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-gray-900 tracking-tight">Social Integrations</h2>
                <p className="text-gray-400 mt-1 text-sm sm:text-base md:text-lg">Manage your connected social media accounts and publishing permissions.</p>
            </div>

            <div className="grid gap-4">
                {(Object.entries(platformConfig) as [keyof typeof platforms, any][]).map(([key, config]) => {
                    const state = platforms[key];
                    const Icon = config.icon;

                    return (
                        <div key={key} className="flex flex-col gap-2">
                            <div
                                className={cn(
                                    "p-4 sm:p-5 rounded-2xl border transition-all duration-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4",
                                    state.connected
                                        ? "bg-white border-gray-100 shadow-sm"
                                        : "bg-gray-50/50 border-dashed border-gray-200"
                                )}
                            >
                                <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto">
                                    <div className={cn("p-2.5 sm:p-3 rounded-xl", config.bgColor)}>
                                        <Icon className={cn("w-5 h-5 sm:w-6 sm:h-6", config.color)} />
                                    </div>
                                    <div className="text-left flex-1">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <h3 className="font-bold text-gray-900 text-sm sm:text-base">{config.name}</h3>
                                            <div className="flex items-center justify-center flex-1">
                                                <Badge variant="outline" className={cn(
                                                    "text-[10px] whitespace-nowrap uppercase tracking-wider py-0 px-2 h-5",
                                                    config.status === 'Free' ? "bg-blue-50 text-blue-700 border-blue-100" : "bg-amber-50 text-amber-700 border-amber-100"
                                                )}>
                                                    {config.status}
                                                </Badge>
                                            </div>
                                            {state.connected ? (
                                                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-100 text-[10px] uppercase tracking-wider py-0 px-2 h-5">
                                                    <CheckCircle2 className="w-3 h-3 mr-1" />
                                                    Connected
                                                </Badge>
                                            ) : (
                                                <Badge variant="outline" className="bg-gray-100 text-gray-500 border-gray-200 text-[10px] uppercase tracking-wider py-0 px-2 h-5">
                                                    Disconnected
                                                </Badge>
                                            )}
                                        </div>
                                        <p className="text-xs text-gray-500 mt-0.5 whitespace-nowrap">
                                            {state.connected
                                                ? `Synced on ${new Date(state.lastSynced || '').toLocaleDateString()}`
                                                : 'Connect your account to start publishing'}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 sm:gap-6 w-full sm:w-auto justify-between sm:justify-start">
                                    {state.connected ? (
                                        <div className="flex items-center gap-2 sm:gap-3 sm:pr-4 sm:border-r border-gray-100">
                                            <Label htmlFor={`${key}-toggle`} className="text-xs font-semibold text-gray-600">
                                                {state.active ? 'Active' : 'Paused'}
                                            </Label>
                                            <Switch
                                                id={`${key}-toggle`}
                                                checked={state.active === true}
                                                onCheckedChange={() => handleToggle(key)}
                                            />
                                        </div>
                                    ) : null}

                                    <Button
                                        variant={state.connected ? "ghost" : "outline"}
                                        size="sm"
                                        onClick={() => state.connected ? handleDisconnect(key) : handleConnect(key)}
                                        className={cn(
                                            "font-bold h-9 sm:h-10 px-3 sm:px-4 text-xs sm:text-sm",
                                            state.connected
                                                ? "text-red-500 hover:text-red-700 hover:bg-red-50"
                                                : "text-pink-600 border-pink-100 hover:bg-pink-50"
                                        )}
                                    >
                                        {state.connected ? (
                                            <><Unlink2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" /> <span className="hidden xs:inline">Disconnect</span><span className="xs:hidden">Disc.</span></>
                                        ) : (
                                            <><Link2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" /> <span className="hidden xs:inline">Connect Account</span><span className="xs:hidden">Connect</span></>
                                        )}
                                    </Button>
                                </div>
                            </div>

                            {/* Manual API Form */}
                            {showManualForm === key && !state.connected && (
                                <div className="p-5 bg-gray-50 border border-gray-100 rounded-2xl mt-1 animate-in slide-in-from-top-2 duration-300">
                                    <div className="space-y-4">
                                        <div className="text-left">
                                            <h4 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-pink-500" />
                                                Enter {config.name} API Credentials
                                            </h4>
                                        </div>

                                        <div className="grid gap-3 text-left">
                                            <>
                                                <div>
                                                    <Label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1.5 block">
                                                        App Client Id <span className="text-red-500">*</span>
                                                    </Label>
                                                    <input
                                                        type="text"
                                                        value={manualKeys[key].apiKey}
                                                        onChange={(e) => setManualKeys({
                                                            ...manualKeys,
                                                            [key]: { ...manualKeys[key], apiKey: e.target.value }
                                                        })}
                                                        placeholder={`Your ${config.name} App Client ID`}
                                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-pink-500 focus:ring-2 focus:ring-pink-200 outline-none text-sm transition-all bg-white"
                                                        required
                                                    />
                                                </div>
                                                <div>
                                                    <Label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1.5 block">
                                                        App Secret <span className="text-red-500">*</span>
                                                    </Label>
                                                    <input
                                                        type="password"
                                                        value={manualKeys[key].apiSecret}
                                                        onChange={(e) => setManualKeys({
                                                            ...manualKeys,
                                                            [key]: { ...manualKeys[key], apiSecret: e.target.value }
                                                        })}
                                                        placeholder={`Your ${config.name} App Secret`}
                                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-pink-500 focus:ring-2 focus:ring-pink-200 outline-none text-sm transition-all bg-white"
                                                        required
                                                    />
                                                </div>
                                            </>
                                        </div>

                                        <div className="flex gap-2 pt-2">
                                            <Button
                                                size="sm"
                                                onClick={() => handleManualConnect(key)}
                                                className="bg-pink-600 hover:bg-pink-700 text-white font-bold h-10 px-6 rounded-xl shadow-lg shadow-pink-200"
                                            >
                                                Save Connection
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => setShowManualForm(null)}
                                                className="text-gray-400 hover:text-gray-600 font-semibold"
                                            >
                                                Cancel
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            <div className="mt-12 p-6 rounded-2xl bg-amber-50 border border-amber-100 flex gap-4 text-left">
                <AlertCircle className="w-6 h-6 text-amber-600 shrink-0" />
                <div>
                    <h4 className="text-sm font-bold text-amber-900">Experimental Feature</h4>
                    <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                        Multi-platform publishing is currently in beta. We recommend reviewing each post before publishing to ensure platform-specific formatting.
                    </p>
                </div>
            </div>

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

export default Integrations;
