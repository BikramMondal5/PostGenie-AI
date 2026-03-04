import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    Share2,
    Wand2,
    User,
    LogOut,
    Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface SettingsLayoutProps {
    onLogout: () => void;
}

const SettingsLayout: React.FC<SettingsLayoutProps> = ({ onLogout }) => {
    const navigate = useNavigate();

    const menuItems = [
        {
            title: 'Integrations',
            icon: Share2,
            path: '/settings/integrations',
            description: 'Connect your social media accounts'
        },
        {
            title: 'Train Your Voice',
            icon: Wand2,
            path: '/settings/train',
            description: 'Teach AI your writing style'
        },
        {
            title: 'Account',
            icon: User,
            path: '/settings/account',
            description: 'Manage your profile and security'
        }
    ];

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Settings Header */}
            <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate('/')}
                            className="text-gray-500 hover:text-pink-600"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Dashboard
                        </Button>
                        <div className="h-6 w-[1px] bg-gray-200" />
                        <div className="flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-pink-600" />
                            <h1 className="text-lg font-bold text-gray-900">Settings</h1>
                        </div>
                    </div>

                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onLogout}
                        className="text-gray-500 hover:text-red-600"
                    >
                        <LogOut className="w-4 h-4 mr-2" />
                        Logout
                    </Button>
                </div>
            </header>

            <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Sidebar */}
                    <aside className="w-full lg:w-64 shrink-0">
                        <nav className="space-y-1">
                            {menuItems.map((item) => (
                                <NavLink
                                    key={item.path}
                                    to={item.path}
                                    className={({ isActive }) => cn(
                                        "flex items-start gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
                                        isActive
                                            ? "bg-white shadow-sm border border-gray-100 text-pink-600"
                                            : "text-gray-600 hover:bg-white hover:text-pink-600"
                                    )}
                                >
                                    <item.icon className={cn(
                                        "w-5 h-5 shrink-0 mt-0.5 transition-colors",
                                        "group-hover:text-pink-600"
                                    )} />
                                    <div>
                                        <div className="text-sm font-semibold">{item.title}</div>
                                        <div className="text-[10px] text-gray-400 font-medium group-hover:text-pink-300">
                                            {item.description}
                                        </div>
                                    </div>
                                </NavLink>
                            ))}
                        </nav>
                    </aside>

                    {/* Main Content */}
                    <main className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 min-h-[600px] overflow-hidden">
                        <div className="p-8">
                            <Outlet />
                        </div>
                    </main>
                </div>
            </div>
        </div>
    );
};

export default SettingsLayout;
