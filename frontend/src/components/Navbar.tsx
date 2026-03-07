import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    Layout,
    Share2,
    Wand2,
    FileText,
    Plus,
    LogOut,
    User as UserIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUser } from '@/lib/UserContext';
import { cn } from '@/lib/utils';

interface NavbarProps {
    onLogout: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ onLogout }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useUser();

    const isPathActive = (path: string) => location.pathname === path;

    return (
        <nav className="relative z-50 border-b border-gray-200 bg-white/80 backdrop-blur-sm sticky top-0">
            <div className="px-8 py-4 flex items-center justify-between">
                {/* Logo and App name */}
                <div
                    className="flex items-center gap-4 cursor-pointer ml-4"
                    onClick={() => navigate('/')}
                >
                    <div className="w-10 h-10 rounded-xl overflow-hidden shadow-sm border border-pink-100 flex-shrink-0">
                        <img
                            src="/app-logo.png"
                            alt="PostGenie AI Logo"
                            className="w-full h-full object-cover"
                        />
                    </div>
                    <div className="flex flex-col">
                        <h1 className="text-xl font-black text-pink-600 leading-none">PostGenie AI</h1>
                        <p className="text-[10px] text-black font-bold uppercase tracking-wider mt-1">AI Magic for Every Post</p>
                    </div>
                </div>

                {/* Center Links */}
                <div className="absolute left-1/2 -translate-x-1/2 -ml-8 hidden lg:flex items-center gap-6">
                    <button
                        onClick={() => navigate('/')}
                        className={cn(
                            "text-sm font-bold transition-all flex items-center gap-2.5 group",
                            isPathActive('/') ? "text-pink-600" : "text-gray-600 hover:text-pink-600"
                        )}
                    >
                        <Layout className={cn("w-4 h-4 transition-colors", isPathActive('/') ? "text-pink-600" : "text-gray-400 group-hover:text-pink-600")} />
                        Canvas
                    </button>
                    <button
                        onClick={() => navigate('/settings/integrations')}
                        className={cn(
                            "text-sm font-bold transition-all flex items-center gap-2.5 group",
                            location.pathname.startsWith('/settings/integrations') ? "text-pink-600" : "text-gray-600 hover:text-pink-600"
                        )}
                    >
                        <Share2 className={cn("w-4 h-4 transition-colors", location.pathname.startsWith('/settings/integrations') ? "text-pink-600" : "text-gray-400 group-hover:text-pink-600")} />
                        Integrations
                    </button>
                    <button
                        onClick={() => navigate('/settings/train')}
                        className={cn(
                            "text-sm font-bold transition-all flex items-center gap-2.5 group",
                            location.pathname.startsWith('/settings/train') ? "text-pink-600" : "text-gray-600 hover:text-pink-600"
                        )}
                    >
                        <Wand2 className={cn("w-4 h-4 transition-colors", location.pathname.startsWith('/settings/train') ? "text-pink-600" : "text-gray-400 group-hover:text-pink-600")} />
                        Fine Tuning
                    </button>
                    <button
                        onClick={() => navigate('/docs')}
                        className={cn(
                            "text-sm font-bold transition-all flex items-center gap-2.5 group",
                            isPathActive('/docs') ? "text-pink-600" : "text-gray-600 hover:text-pink-600"
                        )}
                    >
                        <FileText className={cn("w-4 h-4 transition-colors", isPathActive('/docs') ? "text-pink-600" : "text-gray-400 group-hover:text-pink-600")} />
                        Docs
                    </button>
                </div>

                {/* Right side actions */}
                <div className="flex items-center gap-1">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate('/settings/integrations')}
                        className="px-8 h-11 rounded-2xl border-pink-100 text-pink-600 font-black hover:bg-pink-50 transition-all shadow-sm hidden sm:flex"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Connect Accounts
                    </Button>

                    <button
                        onClick={onLogout}
                        className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-2xl transition-all font-bold text-sm hidden sm:flex"
                    >
                        <LogOut className="w-5 h-5" />
                        Log Out
                    </button>

                    <button
                        onClick={() => navigate('/settings/account')}
                        className="flex items-center gap-3 group"
                    >
                        <div className="flex flex-col items-end hidden md:flex">
                            <p className="text-sm font-bold text-gray-900 group-hover:text-pink-600 transition-colors">
                                {user?.displayName || user?.email?.split('@')[0]}
                            </p>
                            <p className="text-[10px] text-gray-400 font-medium">View Profile</p>
                        </div>
                        <div className="w-10 h-10 rounded-2xl bg-pink-50 flex items-center justify-center text-pink-600 border border-pink-100 shadow-sm overflow-hidden group-hover:border-pink-300 transition-all transform group-hover:scale-105 ring-2 ring-white">
                            {user?.avatarUrl ? (
                                <img src={user.avatarUrl} alt="User Avatar" className="w-full h-full object-cover" />
                            ) : (
                                <UserIcon className="w-5 h-5" />
                            )}
                        </div>
                    </button>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
