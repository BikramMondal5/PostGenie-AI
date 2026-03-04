import React, { useState } from 'react';
import {
    Twitter,
    Linkedin,
    Instagram,
    Facebook,
    CheckCircle2,
    AlertCircle,
    Link2,
    Unlink2
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const Integrations: React.FC = () => {
    const [platforms, setPlatforms] = useState({
        twitter: { connected: true, active: true },
        linkedin: { connected: true, active: true },
        instagram: { connected: false, active: false },
        facebook: { connected: false, active: false },
    });

    const platformConfig = {
        twitter: { name: 'X / Twitter', icon: Twitter, color: 'text-black', bgColor: 'bg-black/5' },
        linkedin: { name: 'LinkedIn', icon: Linkedin, color: 'text-blue-600', bgColor: 'bg-blue-50' },
        instagram: { name: 'Instagram', icon: Instagram, color: 'text-pink-600', bgColor: 'bg-pink-50' },
        facebook: { name: 'Facebook', icon: Facebook, color: 'text-blue-700', bgColor: 'bg-blue-50' },
    };

    const handleToggle = (key: keyof typeof platforms) => {
        if (!platforms[key].connected) return;
        setPlatforms(prev => ({
            ...prev,
            [key]: { ...prev[key], active: !prev[key].active }
        }));
    };

    return (
        <div className="max-w-3xl">
            <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900">Social Integrations</h2>
                <p className="text-gray-500 mt-1">Manage your connected social media accounts and publishing permissions.</p>
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
                                <div>
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
                                    <p className="text-xs text-gray-500 mt-0.5">
                                        {state.connected
                                            ? 'Last synced 2 hours ago'
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
                <div>
                    <h4 className="text-sm font-bold text-amber-900">Experimental Feature</h4>
                    <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                        Multi-platform publishing is currently in beta. We recommend reviewing each post before publishing to ensure platform-specific formatting.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Integrations;
