import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Mail, Lock, Loader2, ArrowRight, UserPlus, LogIn, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

const API_URL = import.meta.env.VITE_API_URL;

interface AuthProps {
    onAuthSuccess: (token: string, user: any) => void;
}

const Auth: React.FC<AuthProps> = ({ onAuthSuccess }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const endpoint = isLogin ? '/auth/login' : '/auth/register';

        try {
            const response = await fetch(`${API_URL}${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Authentication failed');
            }

            // Success
            // Handle the { success: true, data: { token, user } } structure from successResponse
            const token = data.data?.token || data.token;
            const user = data.data?.user || data.user;

            if (!token) {
                throw new Error('No token received from server');
            }

            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));
            onAuthSuccess(token, user);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full bg-white flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background Decoration */}
            <div
                className="absolute inset-0 opacity-[0.03] pointer-events-none"
                style={{
                    backgroundImage: `radial-gradient(circle, #ec4899 1px, transparent 1px)`,
                    backgroundSize: '32px 32px',
                }}
            />

            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="w-full max-w-md z-10"
            >
                <div className="flex justify-center mb-8">
                    <div className="flex items-center gap-3">
                        <div className="p-3 rounded-2xl bg-pink-100 shadow-sm">
                            <Sparkles className="w-8 h-8 text-pink-600" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">PostGenie AI</h1>
                            <p className="text-xs text-gray-500 font-medium">AI Magic for Every Post</p>
                        </div>
                    </div>
                </div>

                <Card className="border-gray-100 shadow-2xl bg-white/80 backdrop-blur-xl">
                    <CardHeader className="space-y-1 pb-6 text-center">
                        <CardTitle className="text-2xl font-bold tracking-tight text-gray-900">
                            {isLogin ? 'Welcome back' : 'Create an account'}
                        </CardTitle>
                        <CardDescription className="text-gray-500">
                            {isLogin
                                ? 'Enter your credentials to access your dashboard'
                                : 'Join PostGenie and start creating magic with AI'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <AnimatePresence mode="wait">
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                >
                                    <Alert variant="destructive" className="bg-red-50 border-red-100 text-red-600">
                                        <AlertCircle className="h-4 w-4" />
                                        <AlertDescription>{error}</AlertDescription>
                                    </Alert>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-gray-700 font-medium">Email</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="name@example.com"
                                        className="pl-10 border-gray-200 focus:border-pink-300 focus:ring-pink-100"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        disabled={loading}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="password" title="password-label" className="text-gray-700 font-medium">Password</Label>
                                    {isLogin && (
                                        <button type="button" className="text-xs text-pink-600 hover:text-pink-700 font-medium transition-colors">
                                            Forgot password?
                                        </button>
                                    )}
                                </div>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                    <Input
                                        id="password"
                                        type="password"
                                        placeholder="••••••••"
                                        className="pl-10 border-gray-200 focus:border-pink-300 focus:ring-pink-100"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        disabled={loading}
                                    />
                                </div>
                            </div>

                            <Button
                                type="submit"
                                className="w-full bg-pink-600 hover:bg-pink-700 text-white h-11 transition-all duration-200 shadow-md hover:shadow-lg active:scale-[0.98]"
                                disabled={loading}
                            >
                                {loading ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <>
                                        {isLogin ? <LogIn className="mr-2 h-4 w-4" /> : <UserPlus className="mr-2 h-4 w-4" />}
                                        {isLogin ? 'Sign In' : 'Create Account'}
                                        <ArrowRight className="ml-2 h-4 w-4" />
                                    </>
                                )}
                            </Button>
                        </form>

                        <div className="relative py-4">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t border-gray-100" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-white px-2 text-gray-400 font-medium">Or continue with</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                            <p className="text-center text-sm text-gray-500">
                                {isLogin ? "Don't have an account?" : "Already have an account?"}
                                <button
                                    onClick={() => setIsLogin(!isLogin)}
                                    className="ml-1 text-pink-600 hover:text-pink-700 font-semibold transition-colors"
                                >
                                    {isLogin ? 'Sign up' : 'Log in'}
                                </button>
                            </p>
                        </div>
                    </CardContent>
                </Card>

                <p className="mt-8 text-center text-xs text-gray-400 px-6">
                    By clicking continue, you agree to our{' '}
                    <a href="#" className="underline underline-offset-4 hover:text-gray-600">Terms of Service</a>{' '}
                    and{' '}
                    <a href="#" className="underline underline-offset-4 hover:text-gray-600">Privacy Policy</a>.
                </p>
            </motion.div>
        </div>
    );
};

export default Auth;
