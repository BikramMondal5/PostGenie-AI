import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import {
    Share2,
    Wand2,
    User
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Navbar from '../Navbar';

interface SettingsLayoutProps {
    onLogout: () => void;
}

const SettingsLayout: React.FC<SettingsLayoutProps> = ({ onLogout }) => {

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
            <Navbar onLogout={onLogout} />

            <div className="flex-1 max-w-7xl mx-auto w-full px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-8">
                <div className="flex flex-col lg:flex-row gap-4 sm:gap-8">
                    {/* Sidebar */}
                    <aside className="w-full lg:w-64 shrink-0 lg:sticky lg:top-24 h-fit">
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
                        <div className="p-4 sm:p-6 md:p-8">
                            <Outlet />
                        </div>
                    </main>
                </div>
            </div>
        </div>
    );
};

export default SettingsLayout;
