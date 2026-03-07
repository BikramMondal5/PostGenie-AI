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
        linkedin: { name: 'LinkedIn', icon: Linkedin, color: 'text-blue-600', bgColor: 'bg-blue-50' },
        twitter: { name: 'X / Twitter', icon: Twitter, color: 'text-black', bgColor: 'bg-black/5' },
        instagram: { name: 'Instagram', icon: Instagram, color: 'text-pink-600', bgColor: 'bg-pink-50' },
        facebook: { name: 'Facebook', icon: Facebook, color: 'text-blue-700', bgColor: 'bg-blue-50' },
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
                        active: true,
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
        try {
            const data = await api.get(`/oauth/initiate?platform=${platform}`);
            if (data.authUrl) {
                window.location.href = data.authUrl;
            }
        } catch (error: any) {
            showResponse("Connection Error", 'Failed to initiate connection: ' + error.message, "error");
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

    const handleToggle = (key: keyof typeof platforms) => {
        if (!platforms[key].connected) return;
        setPlatforms(prev => ({
            ...prev,
            [key]: { ...prev[key], active: !prev[key].active }
        }));
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
            <div className="mb-10">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-50 text-pink-600 text-[10px] font-bold uppercase tracking-widest mb-3">
                    <Link2 className="w-3 h-3" />
                    App Integration
                </div>
                <h2 className="text-4xl font-black text-gray-900 tracking-tight">Social Integrations</h2>
                <p className="text-gray-400 mt-1 text-lg">Manage your connected social media accounts and publishing permissions.</p>
            </div>

            <div className="grid gap-4">
                {(Object.entries(platformConfig) as [keyof typeof platforms, any][]).map(([key, config]) => {
                    const state = platforms[key];
                    const Icon = config.icon;

                    return (
                        <div
                            key={key}
                            className={cn(
                                "p-5 rounded-2xl border transition-all duration-300 flex items-center justify-between",
                                state.connected
                                    ? "bg-white border-gray-100 shadow-sm"
                                    : "bg-gray-50/50 border-dashed border-gray-200"
                            )}
                        >
                            <div className="flex items-center gap-4">
                                <div className={cn("p-3 rounded-xl", config.bgColor)}>
                                    <Icon className={cn("w-6 h-6", config.color)} />
                                </div>
                                <div className="text-left">
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-bold text-gray-900">{config.name}</h3>
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

                            <div className="flex items-center gap-6">
                                {state.connected ? (
                                    <div className="flex items-center gap-3 pr-4 border-r border-gray-100">
                                        <Label htmlFor={`${key}-toggle`} className="text-xs font-semibold text-gray-600">
                                            {state.active ? 'Active' : 'Paused'}
                                        </Label>
                                        <Switch
                                            id={`${key}-toggle`}
                                            checked={state.active}
                                            onCheckedChange={() => handleToggle(key)}
                                        />
                                    </div>
                                ) : null}

                                <Button
                                    variant={state.connected ? "ghost" : "outline"}
                                    size="sm"
                                    onClick={() => state.connected ? handleDisconnect(key) : handleConnect(key)}
                                    className={cn(
                                        "font-bold h-10 px-4",
                                        state.connected
                                            ? "text-red-500 hover:text-red-700 hover:bg-red-50"
                                            : "text-pink-600 border-pink-100 hover:bg-pink-50"
                                    )}
                                >
                                    {state.connected ? (
                                        <><Unlink2 className="w-4 h-4 mr-2" /> Disconnect</>
                                    ) : (
                                        <><Link2 className="w-4 h-4 mr-2" /> Connect Account</>
                                    )}
                                </Button>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="mt-12 p-6 rounded-2xl bg-amber-50 border border-amber-100 flex gap-4">
                <AlertCircle className="w-6 h-6 text-amber-600 shrink-0" />
                <div className="text-left">
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
