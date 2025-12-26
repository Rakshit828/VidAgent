import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useSignup } from '../hooks/api/useAuth';
import { Button } from '../components/ui/button-shadcn';
import { Input } from '../components/ui/input-shadcn';
import { Video, Mail, Lock, ArrowRight } from 'lucide-react';
import { FullScreenLoader } from '../components/ui/FullScreenLoader';

/**
 * Signup Page Component.
 * Collects user details and calls the useSignup mutation hook.
 */
const Signup = () => {
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        email: '',
        password: ''
    });
    const navigate = useNavigate();

    // TanStack Query Mutation Hook for registration.
    const signupMutation = useSignup();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            // Executing the signup mutation
            await signupMutation.mutateAsync(formData);
            // On success, we navigate to login (or dashboard if backend auto-logs in)
            // For now, let's go to login as is common after signup
            navigate('/login');
        } catch (error) {
            // Errors are logged in the hook
        }
    };

    return (
        <>
            <FullScreenLoader isVisible={signupMutation.isPending} label="Creating your account..." />
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
                            <h1 className="text-3xl font-black tracking-tight mb-2">Create Account</h1>
                            <p className="text-muted-foreground">Join us to start analyzing YouTube videos.</p>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium ml-1">First Name</label>
                                    <Input
                                        name="first_name"
                                        placeholder="John"
                                        value={formData.first_name}
                                        onChange={handleChange}
                                        className="h-12 rounded-xl bg-background/50 border-border/60 focus:bg-background"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium ml-1">Last Name</label>
                                    <Input
                                        name="last_name"
                                        placeholder="Doe"
                                        value={formData.last_name}
                                        onChange={handleChange}
                                        className="h-12 rounded-xl bg-background/50 border-border/60 focus:bg-background"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium ml-1">Email Address</label>
                                <div className="relative group">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                    <Input
                                        name="email"
                                        type="email"
                                        placeholder="name@example.com"
                                        value={formData.email}
                                        onChange={handleChange}
                                        className="pl-10 h-12 rounded-xl bg-background/50 border-border/60 focus:bg-background"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium ml-1">Password</label>
                                <div className="relative group">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                    <Input
                                        name="password"
                                        type="password"
                                        placeholder="••••••••"
                                        value={formData.password}
                                        onChange={handleChange}
                                        className="pl-10 h-12 rounded-xl bg-background/50 border-border/60 focus:bg-background"
                                        required
                                    />
                                </div>
                            </div>

                            <Button
                                type="submit"
                                className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-lg shadow-primary/20 transition-all active:scale-[0.98] mt-2 group"
                                disabled={signupMutation.isPending}
                            >
                                Create Account <ArrowRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />
                            </Button>
                        </form>

                        {/* Footer */}
                        <div className="mt-8 text-center text-sm">
                            <span className="text-muted-foreground">Already have an account? </span>
                            <Link to="/login" className="text-primary font-bold hover:underline">Sign in</Link>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default Signup;
