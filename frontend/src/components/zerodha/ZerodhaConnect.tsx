import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingUp, Link2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

export const ZerodhaConnect = () => {
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    const handleConnect = () => {
        setLoading(true);
        try {
            // Step 1: Hit backend to get redirect URL.
            const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8000";

            // We pass the JWT token so the backend knows WHO is initiating the OAuth flow, 
            // although we can also use sessions. For a clean implementation, 
            // we'll hit the /login route and rely on the redirect handling.
            // Easiest approach for OAuth: Just window.location.href to the backend route,
            // But we need the frontend's JWT token context.

            const token = localStorage.getItem('trustix.auth.token'); // Assuming standard JWT
            if (!token) {
                toast({
                    title: "Authentication Required",
                    description: "Please sign in to connect your broker.",
                    variant: "destructive"
                });
                setLoading(false);
                return;
            }

            // In a real OAuth flow with stateless JWT, you'd typically pass the 
            // Authorization token in a query param or a temporary session cookie.
            // For this MVP, we direct the user to the Kite login URL which we can fetch first.

            fetch(`${apiUrl}/zerodha/login`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })
                .then(res => {
                    // If the backend returns a 307 redirect or similar, we can follow it
                    // Often it's easier to just do window.location.href directly to the backend 
                    // endpoint if it relies on cookies, or fetch the URL and then redirect
                    if (res.redirected) {
                        window.location.href = res.url;
                    } else {
                        window.location.href = `${apiUrl}/zerodha/login`;
                    }
                })
                .catch((err) => {
                    console.error("Login redirect failed", err);
                    window.location.href = `${apiUrl}/zerodha/login`;
                });

        } catch (error) {
            console.error(error);
            setLoading(false);
        }
    };

    return (
        <Card className="w-full bg-black/40 border-green-500/20 mb-8 backdrop-blur-md">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                    <TrendingUp className="text-green-400" />
                    Connect Broker
                </CardTitle>
                <CardDescription className="text-gray-400">
                    Link your Zerodha Kite account to securely import and monitor your holdings in the vault. We use zero-knowledge architecture—we never see your password.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Button
                    onClick={handleConnect}
                    disabled={loading}
                    className="bg-orange-500 hover:bg-orange-600 text-white w-full sm:w-auto"
                >
                    {loading ? "Redirecting to Kite..." : (
                        <span className="flex items-center gap-2">
                            <Link2 size={16} /> Link Zerodha Kite
                        </span>
                    )}
                </Button>
            </CardContent>
        </Card>
    );
};
