import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useLogin } from '../hooks/api/useAuth';
import { Button } from '../components/ui/button-shadcn';
import { Input } from '../components/ui/input-shadcn';
import { Video, Mail, Lock, ArrowRight } from 'lucide-react';
import { FullScreenLoader } from '../components/ui/FullScreenLoader';

/**
 * Login Page Component.
 * Handles user authentication by collecting email/password and calling the useLogin hook.
 */
const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    // TanStack Query Mutation Hook for logging in.
    // It provides 'mutateAsync' to trigger the mutation and 'isPending' for loading state.
    const loginMutation = useLogin();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            // Triggering the login mutation
            await loginMutation.mutateAsync({ email, password });
            // Redirect to dashboard on success
            navigate('/');
        } catch (error) {
            // Error handling is mostly managed inside the hook (logging to console),
            // but we could also set local error state here if needed for UI.
        }
    };

    return (
        <>
            <FullScreenLoader isVisible={loginMutation.isPending} label="Signing you in..." />
            <div className="min-h-screen w-full flex items-center justify-center bg-background relative overflow-hidden p-4">
                {/* Background Decorative Elements */}
                <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-600/10 rounded-full blur-[120px]" />

                <div className="w-full max-w-md z-10 animate-in fade-in zoom-in-95 duration-500">
                    <div className="bg-card/80 backdrop-blur-xl border border-border/50 rounded-3xl shadow-2xl p-8">
                        {/* Header */}
                        <div className="text-center mb-8">
                            <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-2xl mb-4">
                                <Video className="w-8 h-8 text-primary" />
                            </div>
                            <h1 className="text-3xl font-black tracking-tight mb-2">Welcome Back</h1>
                            <p className="text-muted-foreground">Sign in to continue your analysis.</p>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium ml-1">Email Address</label>
                                <div className="relative group">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                    <Input
                                        type="email"
                                        placeholder="name@example.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="pl-10 h-12 rounded-xl bg-background/50 border-border/60 focus:bg-background"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between ml-1">
                                    <label className="text-sm font-medium">Password</label>
                                    <Link to="#" className="text-xs text-primary hover:underline">Forgot password?</Link>
                                </div>
                                <div className="relative group">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                    <Input
                                        type="password"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="pl-10 h-12 rounded-xl bg-background/50 border-border/60 focus:bg-background"
                                        required
                                    />
                                </div>
                            </div>

                            <Button
                                type="submit"
                                className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-lg shadow-primary/20 transition-all active:scale-[0.98] mt-2 group"
                                disabled={loginMutation.isPending}
                            >
                                Sign In <ArrowRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />
                            </Button>
                        </form>

                        {/* Footer */}
                        <div className="mt-8 text-center text-sm">
                            <span className="text-muted-foreground">Don't have an account? </span>
                            <Link to="/signup" className="text-primary font-bold hover:underline">Create account</Link>
                        </div>
                    </div>

                    <div className="mt-8 text-center">
                        <p className="text-xs text-muted-foreground">
                            By continuing, you agree to our Terms of Service and Privacy Policy.
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
};

export default Login;
