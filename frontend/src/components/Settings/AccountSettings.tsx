import React, { useState, useEffect, useRef } from 'react';
import {
    User,
    Camera,
    Lock,
    Eye,
    EyeOff,
    RefreshCw,
    CheckCircle2,
    Globe,
    FileText,
    Sparkles,
    Shield,
    Trash2,
    AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';
import { ResponseModal } from '@/components/ui/ResponseModal';
import { useUser } from '@/lib/UserContext';

// ─── Curated avatar set (DiceBear Avatars via public CDN) ───────────────────
const PRESET_AVATARS = [
    { id: 'av1', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=PostGenie&backgroundColor=ffb3c6' },
    { id: 'av2', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Aria&backgroundColor=c0fdff' },
    { id: 'av3', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Zoe&backgroundColor=d4f1c0' },
    { id: 'av4', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Kai&backgroundColor=ffd6a5' },
    { id: 'av5', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Nova&backgroundColor=e8c3fd' },
    { id: 'av6', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Max&backgroundColor=ffc8dd' },
    { id: 'av7', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Luna&backgroundColor=bde0fe' },
    { id: 'av8', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Pixel&backgroundColor=ffffb3' },
    { id: 'av9', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Ember&backgroundColor=ffadad' },
    { id: 'av10', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Sage&backgroundColor=caffbf' },
    { id: 'av11', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=River&backgroundColor=a8dadc' },
    { id: 'av12', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Storm&backgroundColor=e9c46a' },
];

const TIMEZONES = [
    'UTC', 'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
    'America/Sao_Paulo', 'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'Europe/Moscow',
    'Asia/Kolkata', 'Asia/Tokyo', 'Asia/Shanghai', 'Asia/Singapore', 'Asia/Dubai',
    'Australia/Sydney', 'Pacific/Auckland',
];

interface UserProfile {
    userId: string;
    email: string;
    displayName: string;
    avatarUrl: string;
    bio: string;
    timezone: string;
    createdAt: string;
    lastLoginAt: string;
}

// ─── Section wrapper ─────────────────────────────────────────────────────────
const Section: React.FC<{ icon: React.ElementType; title: string; description: string; children: React.ReactNode }> = ({
    icon: Icon, title, description, children
}) => (
    <div className="bg-white border border-gray-100 rounded-[2.5rem] p-8 shadow-sm hover:shadow-md transition-shadow duration-300">
        <div className="flex items-start gap-4 mb-8">
            <div className="p-3 bg-pink-50 rounded-2xl">
                <Icon className="w-5 h-5 text-pink-600" />
            </div>
            <div>
                <h3 className="text-lg font-black text-gray-900">{title}</h3>
                <p className="text-sm text-gray-400 font-medium mt-0.5">{description}</p>
            </div>
        </div>
        {children}
    </div>
);

// ─── Field wrapper ────────────────────────────────────────────────────────────
const Field: React.FC<{ label: string; children: React.ReactNode; hint?: string }> = ({ label, children, hint }) => (
    <div className="space-y-2">
        <label className="text-sm font-bold text-gray-700">{label}</label>
        {children}
        {hint && <p className="text-xs text-gray-400">{hint}</p>}
    </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────
const AccountSettings: React.FC = () => {
    const { refreshUser } = useUser();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isChangingPw, setIsChangingPw] = useState(false);
    const [isAvatarPickerOpen, setIsAvatarPickerOpen] = useState(false);

    // Form state
    const [displayName, setDisplayName] = useState('');
    const [bio, setBio] = useState('');
    const [timezone, setTimezone] = useState('UTC');
    const [previewAvatar, setPreviewAvatar] = useState('');

    // Password form
    const [currentPw, setCurrentPw] = useState('');
    const [newPw, setNewPw] = useState('');
    const [confirmPw, setConfirmPw] = useState('');
    const [showCurrentPw, setShowCurrentPw] = useState(false);
    const [showNewPw, setShowNewPw] = useState(false);
    const [showAccountId, setShowAccountId] = useState(false);
    const [isSecurityOpen, setIsSecurityOpen] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const [modal, setModal] = useState<{ isOpen: boolean; title: string; message: string; type: 'success' | 'error' | 'info' }>({
        isOpen: false, title: '', message: '', type: 'info',
    });

    const showModal = (title: string, message: string, type: 'success' | 'error' | 'info' = 'info') => {
        setModal({ isOpen: true, title, message, type });
    };

    // ── Fetch profile ──────────────────────────────────────────────────────
    useEffect(() => {
        const fetch = async () => {
            try {
                const data = await api.get('/user/profile');
                const u = data.user as UserProfile;
                setProfile(u);
                setDisplayName(u.displayName || '');
                setBio(u.bio || '');
                setTimezone(u.timezone || 'UTC');
                setPreviewAvatar(u.avatarUrl || '');
            } catch (e: any) {
                showModal('Error', 'Failed to load your profile.', 'error');
            } finally {
                setLoading(false);
            }
        };
        fetch();
    }, []);

    // ── Handle image upload (converts to base64 data URL stored as avatarUrl) ─
    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 2 * 1024 * 1024) {
            showModal('File Too Large', 'Please choose an image smaller than 2MB.', 'error');
            return;
        }
        const reader = new FileReader();
        reader.onload = (ev) => {
            setPreviewAvatar(ev.target?.result as string);
            setIsAvatarPickerOpen(false);
        };
        reader.readAsDataURL(file);
    };

    // ── Save profile ───────────────────────────────────────────────────────
    const handleSaveProfile = async () => {
        setIsSaving(true);
        try {
            await api.patch('/user/profile', {
                displayName: displayName.trim(),
                avatarUrl: previewAvatar,
                bio: bio.trim(),
                timezone,
            });

            // Update localStorage user object too
            const stored = localStorage.getItem('user');
            if (stored) {
                const parsed = JSON.parse(stored);
                localStorage.setItem('user', JSON.stringify({ ...parsed, displayName: displayName.trim(), avatarUrl: previewAvatar }));
            }

            await refreshUser();
            showModal('Profile Saved', 'Your account settings have been updated successfully.', 'success');
        } catch (e: any) {
            showModal('Save Failed', e.message || 'Something went wrong.', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    // ── Change password ────────────────────────────────────────────────────
    const handleChangePassword = async () => {
        if (newPw !== confirmPw) {
            showModal('Passwords Don\'t Match', 'New password and confirmation must be identical.', 'error');
            return;
        }
        if (newPw.length < 8) {
            showModal('Too Short', 'New password must be at least 8 characters.', 'error');
            return;
        }
        setIsChangingPw(true);
        try {
            await api.patch('/user/profile', { currentPassword: currentPw, newPassword: newPw });
            setCurrentPw(''); setNewPw(''); setConfirmPw('');
            showModal('Password Updated', 'Your password has been changed. Log in with your new password next time.', 'success');
        } catch (e: any) {
            showModal('Password Change Failed', e.message || 'Something went wrong.', 'error');
        } finally {
            setIsChangingPw(false);
        }
    };

    // ── Password strength ──────────────────────────────────────────────────
    const passwordStrength = (pw: string) => {
        if (!pw) return { score: 0, label: '', color: '' };
        let score = 0;
        if (pw.length >= 8) score++;
        if (/[A-Z]/.test(pw)) score++;
        if (/[0-9]/.test(pw)) score++;
        if (/[^A-Za-z0-9]/.test(pw)) score++;
        const map = [
            { score: 0, label: '', color: '' },
            { score: 1, label: 'Weak', color: 'bg-red-400' },
            { score: 2, label: 'Fair', color: 'bg-amber-400' },
            { score: 3, label: 'Good', color: 'bg-blue-400' },
            { score: 4, label: 'Strong', color: 'bg-emerald-400' },
        ];
        return map[score];
    };

    const pwStrength = passwordStrength(newPw);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-24">
                <RefreshCw className="w-10 h-10 text-pink-500 animate-spin mb-4" />
                <p className="text-gray-400 font-medium">Loading your account...</p>
            </div>
        );
    }

    const initials = displayName
        ? displayName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
        : profile?.email?.[0]?.toUpperCase() || '?';

    return (
        <div className="max-w-3xl space-y-10">
            {/* Header */}
            <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-50 text-pink-600 text-[10px] font-bold uppercase tracking-widest mb-3">
                    <Sparkles className="w-3 h-3" />
                    Account Settings
                </div>
                <h2 className="text-4xl font-black text-gray-900 tracking-tight">Your Profile</h2>
                <p className="text-gray-400 mt-1 text-lg">Manage your identity, security, and preferences.</p>
            </div>

            {/* ── Avatar + Name ────────────────────────────────────────────── */}
            <Section icon={User} title="Profile Identity" description="Your public name, photo and short bio">
                {/* Avatar row */}
                <div className="flex items-center gap-8 mb-8">
                    <div className="relative group">
                        {previewAvatar ? (
                            <img
                                src={previewAvatar}
                                alt="Avatar"
                                className="w-24 h-24 rounded-[1.5rem] object-cover border-4 border-white shadow-xl ring-2 ring-pink-100"
                            />
                        ) : (
                            <div className="w-24 h-24 rounded-[1.5rem] bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center text-white text-3xl font-black shadow-xl">
                                {initials}
                            </div>
                        )}
                        <button
                            onClick={() => setIsAvatarPickerOpen(!isAvatarPickerOpen)}
                            className="absolute inset-0 rounded-[1.5rem] bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer"
                        >
                            <Camera className="w-6 h-6 text-white" />
                        </button>
                    </div>

                    <div className="space-y-2">
                        <p className="font-bold text-gray-800 text-lg">{displayName || profile?.email}</p>
                        <p className="text-sm text-gray-400">{profile?.email}</p>
                        <div className="flex gap-2">
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setIsAvatarPickerOpen(!isAvatarPickerOpen)}
                                className="rounded-xl border-gray-200 text-gray-600 hover:text-pink-600 hover:border-pink-200 text-xs font-bold"
                            >
                                <Camera className="w-3.5 h-3.5 mr-2" />
                                Choose Avatar
                            </Button>
                            {previewAvatar && (
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => setPreviewAvatar('')}
                                    className="rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 text-xs"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Avatar picker panel */}
                {isAvatarPickerOpen && (
                    <div className="mb-8 p-6 bg-gray-50 rounded-[2rem] border border-gray-100 space-y-4">
                        <p className="text-xs font-black text-gray-500 uppercase tracking-widest">Choose a preset avatar</p>
                        <div className="grid grid-cols-6 gap-3">
                            {PRESET_AVATARS.map((av) => (
                                <button
                                    key={av.id}
                                    onClick={() => { setPreviewAvatar(av.url); setIsAvatarPickerOpen(false); }}
                                    className={cn(
                                        "w-full aspect-square rounded-2xl overflow-hidden border-2 transition-all duration-200 hover:scale-110",
                                        previewAvatar === av.url ? "border-pink-500 shadow-lg shadow-pink-200" : "border-transparent hover:border-pink-200"
                                    )}
                                >
                                    <img src={av.url} alt="avatar option" className="w-full h-full object-cover" />
                                </button>
                            ))}
                        </div>
                        <div className="flex items-center gap-3 pt-2 border-t border-gray-200">
                            <p className="text-xs font-bold text-gray-400">Or upload your own</p>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => fileInputRef.current?.click()}
                                className="rounded-xl text-xs font-bold border-dashed border-gray-300 text-gray-500 hover:text-pink-600 hover:border-pink-200"
                            >
                                <Camera className="w-3.5 h-3.5 mr-2" />
                                Upload Photo
                            </Button>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleImageUpload}
                            />
                        </div>
                    </div>
                )}

                {/* Name + Bio fields */}
                <div className="space-y-5">
                    <Field label="Display Name" hint="This is the name shown across the app">
                        <Input
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            placeholder="e.g. Alex Johnson"
                            className="rounded-2xl border-gray-200 focus:border-pink-300 h-12 font-medium"
                        />
                    </Field>

                    <Field label="Bio" hint="A short description about yourself (max 160 characters)">
                        <div className="relative">
                            <textarea
                                value={bio}
                                onChange={(e) => setBio(e.target.value.slice(0, 160))}
                                placeholder="Building great things with AI..."
                                rows={3}
                                className="w-full rounded-2xl border border-gray-200 focus:border-pink-300 focus:ring-1 focus:ring-pink-100 py-3 px-4 text-sm font-medium text-gray-700 resize-none outline-none transition-colors"
                            />
                            <span className="absolute bottom-3 right-4 text-[10px] text-gray-400 font-bold">{bio.length}/160</span>
                        </div>
                    </Field>
                </div>
            </Section>

            {/* ── Preferences ───────────────────────────────────────────────── */}
            <Section icon={Globe} title="Preferences" description="Timezone and localization settings">
                <Field label="Timezone" hint="Used for scheduled post timing">
                    <div className="relative">
                        <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        <select
                            value={timezone}
                            onChange={(e) => setTimezone(e.target.value)}
                            className="w-full rounded-2xl border border-gray-200 focus:outline-none focus:border-pink-300 h-12 pl-10 pr-4 text-sm font-medium text-gray-700 bg-white appearance-none"
                        >
                            {TIMEZONES.map((tz) => (
                                <option key={tz} value={tz}>{tz}</option>
                            ))}
                        </select>
                    </div>
                </Field>
            </Section>

            {/* ── Account info ──────────────────────────────────────────────── */}
            <Section icon={FileText} title="Account Info" description="Your account details and membership">
                <div className="grid grid-cols-2 gap-4">
                    {[
                        { label: 'Email Address', key: 'email', value: profile?.email || '—' },
                        { label: 'Member Since', key: 'memberSince', value: profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : '—' },
                        { label: 'Last Login', key: 'lastLogin', value: profile?.lastLoginAt ? new Date(profile.lastLoginAt).toLocaleString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—' },
                        {
                            label: 'Account ID',
                            key: 'id',
                            value: profile?.userId || '—',
                            isSensitive: true
                        },
                    ].map(({ label, value, isSensitive, key }) => (
                        <div key={key} className="bg-gray-50 rounded-2xl px-5 py-4">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{label}</p>
                            <div className="flex items-center justify-between gap-2 overflow-hidden">
                                <p className="text-sm font-bold text-gray-800 truncate">
                                    {isSensitive ? (showAccountId ? value : '••••••••' + value.slice(-4)) : value}
                                </p>
                                {isSensitive && (
                                    <button
                                        onClick={() => setShowAccountId(!showAccountId)}
                                        className="text-gray-400 hover:text-pink-600 transition-colors flex-shrink-0"
                                    >
                                        {showAccountId ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </Section>

            {/* ── Save profile button ───────────────────────────────────────── */}
            <div className="flex justify-end">
                <Button
                    onClick={handleSaveProfile}
                    disabled={isSaving}
                    className="bg-pink-500 hover:bg-pink-600 text-white rounded-2xl px-10 h-14 font-black text-base shadow-md shadow-pink-200/50 transition-all flex items-center gap-3 transform hover:scale-105"
                >
                    {isSaving ? <RefreshCw className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                    {isSaving ? 'Saving...' : 'Save Changes'}
                </Button>
            </div>

            {/* ── Change Password ───────────────────────────────────────────── */}
            <div className="bg-white border border-gray-100 rounded-[2.5rem] shadow-sm overflow-hidden">
                <button
                    onClick={() => setIsSecurityOpen(!isSecurityOpen)}
                    className="w-full flex items-center justify-between p-8 hover:bg-gray-50/50 transition-colors"
                >
                    <div className="flex items-start gap-4">
                        <div className="p-3 bg-pink-50 rounded-2xl">
                            <Shield className="w-5 h-5 text-pink-600" />
                        </div>
                        <div className="text-left">
                            <h3 className="text-lg font-black text-gray-900">Security</h3>
                            <p className="text-sm text-gray-400 font-medium mt-0.5">Change your login password</p>
                        </div>
                    </div>
                    <div className={cn("transition-transform duration-300", isSecurityOpen ? "rotate-180" : "")}>
                        <RefreshCw className="w-5 h-5 text-gray-400" />
                    </div>
                </button>

                {isSecurityOpen && (
                    <div className="px-8 pb-8 pt-2 space-y-5 animate-in fade-in slide-in-from-top-4 duration-300">
                        <Field label="Current Password">
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                <input
                                    type={showCurrentPw ? 'text' : 'password'}
                                    value={currentPw}
                                    onChange={(e) => setCurrentPw(e.target.value)}
                                    placeholder="Enter current password"
                                    className="w-full rounded-2xl border border-gray-200 focus:outline-none focus:border-pink-300 h-12 pl-10 pr-12 text-sm font-medium text-gray-700"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowCurrentPw(!showCurrentPw)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    {showCurrentPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </Field>

                        <Field label="New Password">
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                <input
                                    type={showNewPw ? 'text' : 'password'}
                                    value={newPw}
                                    onChange={(e) => setNewPw(e.target.value)}
                                    placeholder="Min 8 characters"
                                    className="w-full rounded-2xl border border-gray-200 focus:outline-none focus:border-pink-300 h-12 pl-10 pr-12 text-sm font-medium text-gray-700"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowNewPw(!showNewPw)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    {showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                            {/* Strength bar */}
                            {newPw && (
                                <div className="mt-2 space-y-1">
                                    <div className="flex gap-1">
                                        {[1, 2, 3, 4].map((s) => (
                                            <div key={s} className={cn("h-1.5 flex-1 rounded-full transition-all duration-300", s <= pwStrength.score ? pwStrength.color : 'bg-gray-100')} />
                                        ))}
                                    </div>
                                    <p className={cn("text-[11px] font-bold", pwStrength.score >= 3 ? 'text-emerald-500' : pwStrength.score >= 2 ? 'text-amber-500' : 'text-red-500')}>
                                        {pwStrength.label}
                                    </p>
                                </div>
                            )}
                        </Field>

                        <Field label="Confirm New Password">
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                <input
                                    type="password"
                                    value={confirmPw}
                                    onChange={(e) => setConfirmPw(e.target.value)}
                                    placeholder="Re-enter new password"
                                    className={cn(
                                        "w-full rounded-2xl border h-12 pl-10 pr-4 text-sm font-medium text-gray-700 focus:outline-none focus:border-pink-300",
                                        confirmPw && newPw !== confirmPw ? "border-red-300 bg-red-50/30" : "border-gray-200"
                                    )}
                                />
                            </div>
                            {confirmPw && newPw !== confirmPw && (
                                <p className="text-xs text-red-500 font-bold flex items-center gap-1 mt-1">
                                    <AlertTriangle className="w-3 h-3" /> Passwords do not match
                                </p>
                            )}
                        </Field>

                        <div className="flex justify-end pt-2">
                            <Button
                                onClick={handleChangePassword}
                                disabled={isChangingPw || !currentPw || !newPw || newPw !== confirmPw}
                                className="bg-gray-900 hover:bg-gray-800 text-white rounded-2xl px-8 h-12 font-bold shadow-lg transition-all flex items-center gap-2 disabled:opacity-40"
                            >
                                {isChangingPw ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
                                {isChangingPw ? 'Updating...' : 'Change Password'}
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            {/* ── Danger Zone ────────────────────────────────────────────────── */}
            <div className="bg-red-50/30 border border-red-100 rounded-[2.5rem] p-8 mt-12">
                <div className="flex items-start gap-4 mb-8">
                    <div className="p-3 bg-red-100 rounded-2xl">
                        <AlertTriangle className="w-5 h-5 text-red-600" />
                    </div>
                    <div>
                        <h3 className="text-lg font-black text-red-900">Danger Zone</h3>
                        <p className="text-sm text-red-500/70 font-medium mt-0.5">Irreversible actions for your account</p>
                    </div>
                </div>

                <div className="flex items-center justify-between gap-6 p-6 bg-white border border-red-100 rounded-3xl">
                    <div>
                        <p className="font-bold text-gray-900">Delete Account</p>
                        <p className="text-xs text-gray-500 mt-1">Once deleted, all your data, posts, and AI profiles will be gone forever.</p>
                    </div>
                    <Button
                        variant="destructive"
                        onClick={() => {
                            if (window.confirm("ARE YOU ABSOLUTELY SURE? This will permanently delete your account and all associated data. This action cannot be undone.")) {
                                api.delete('/user/profile').then(() => {
                                    localStorage.clear();
                                    window.location.href = '/';
                                }).catch(e => showModal('Error', e.message, 'error'));
                            }
                        }}
                        className="rounded-xl px-6 h-11 font-bold whitespace-nowrap"
                    >
                        Delete Forever
                    </Button>
                </div>
            </div>

            <ResponseModal
                isOpen={modal.isOpen}
                onClose={() => setModal(prev => ({ ...prev, isOpen: false }))}
                title={modal.title}
                message={modal.message}
                type={modal.type}
            />
        </div>
    );
};

export default AccountSettings;
