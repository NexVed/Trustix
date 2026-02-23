import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Auth.css";

export default function Auth() {
    const [isLogin, setIsLogin] = useState(true);
    const navigate = useNavigate();

    const handleGoogleLogin = (e: React.MouseEvent) => {
        e.preventDefault();
        // Simulate login and go to dashboard
        navigate("/dashboard");
    };

    const handleEmailAuth = (e: React.FormEvent) => {
        e.preventDefault();
        // Simulate login and go to dashboard
        navigate("/dashboard");
    };

    return (
        <div className="auth-wrapper">
            <video src="/bglogin.mp4" autoPlay loop muted playsInline className="vid-bg" />
            <div className="bg-overlay"></div>

            <div className="orb orb1"></div>
            <div className="orb orb2"></div>
            <div className="orb orb3"></div>

            <div className="card">
                <div className="brand">
                    <img src="/logo.png" alt="Trustix Logo" className="w-10 h-10 object-contain" />
                    <span className="brand-name">TRUSTIX</span>
                </div>

                <h1>{isLogin ? "Welcome back" : "Create an account"}</h1>
                <p className="subtitle">
                    {isLogin ? "Sign in to continue your journey" : "Join us to secure your digital legacy"}
                </p>

                {/* Google OAuth Button */}
                <a href="#" className="btn-google" onClick={handleGoogleLogin}>
                    <svg className="google-logo" width="20" height="20" viewBox="0 0 48 48">
                        <path
                            fill="#EA4335"
                            d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                        />
                        <path
                            fill="#4285F4"
                            d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                        />
                        <path
                            fill="#FBBC05"
                            d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                        />
                        <path
                            fill="#34A853"
                            d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                        />
                        <path fill="none" d="M0 0h48v48H0z" />
                    </svg>
                    {isLogin ? "Continue with Google" : "Sign up with Google"}
                </a>

                <div className="divider">
                    <span>or</span>
                </div>

                <form onSubmit={handleEmailAuth}>
                    {!isLogin && (
                        <div className="field">
                            <label>Full Name</label>
                            <input type="text" placeholder="John Doe" required />
                        </div>
                    )}
                    <div className="field">
                        <label>Email</label>
                        <input type="email" placeholder="you@example.com" required />
                    </div>
                    <div className="field">
                        <label>Password</label>
                        <input type="password" placeholder="••••••••" required />
                    </div>

                    {isLogin && (
                        <a href="#" className="forgot" onClick={(e) => e.preventDefault()}>
                            Forgot password?
                        </a>
                    )}

                    <button type="submit" className="btn-submit">
                        {isLogin ? "Sign In" : "Create Account"}
                    </button>
                </form>

                <p className="footer">
                    {isLogin ? "Don't have an account? " : "Already have an account? "}
                    <a
                        href="#"
                        onClick={(e) => {
                            e.preventDefault();
                            setIsLogin(!isLogin);
                        }}
                    >
                        {isLogin ? "Create one" : "Sign in"}
                    </a>
                </p>
            </div>
        </div>
    );
}
