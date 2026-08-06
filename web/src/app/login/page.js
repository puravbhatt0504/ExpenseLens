'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, Hexagon } from 'lucide-react';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import api from '@/lib/api';

export default function Login() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGoogleSuccess = async (credentialResponse) => {
    if (loading) return;
    setLoading(true);
    try {
      const idToken = credentialResponse.credential;
      
      // Pass the Google ID token to our backend /auth/login
      const { data } = await api.post('/auth/login', { idToken });
      
      if (data.user) {
        // Our backend verifies the idToken and creates/fetches the user.
        // We use the same Google idToken for our API requests as our "Bearer" token,
        // exactly how the Flutter app does it.
        localStorage.setItem('token', idToken);
        router.push('/dashboard');
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <GoogleOAuthProvider clientId="264648333363-2qmdh3i22gk2rhittp3cuitn06v21ev5.apps.googleusercontent.com">
      <div className="min-h-screen flex flex-col justify-center items-center bg-surface relative overflow-hidden">
        <Link href="/" className="absolute top-8 left-8 flex items-center gap-2 text-text-muted font-medium text-sm transition-colors hover:text-foreground z-10">
          <ArrowLeft size={16} /> Back
        </Link>
        
        <motion.div 
          className="w-full max-w-[400px] p-10 bg-white border border-border shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-xl relative z-10 flex flex-col items-center text-center"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          <div className="mb-6 bg-black text-white p-2 rounded-lg">
            <Hexagon size={28} />
          </div>
          
          <h1 className="text-2xl font-bold tracking-tight mb-2">Welcome to ExpenseLens</h1>
          <p className="text-text-muted font-medium text-sm mb-8">
            Sign in with your Google account to continue.
          </p>

          <div className="w-full flex justify-center mb-4">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => setError('Google Login Failed')}
              theme="outline"
              shape="rectangular"
              size="large"
              text="continue_with"
              width="300px"
            />
          </div>
          
          {error && <p className="text-[#e00] font-medium text-sm mt-4">{error}</p>}
          
          <p className="text-[12px] text-text-muted mt-8">
            By signing in, you agree to our Terms of Service and Privacy Policy.
          </p>
        </motion.div>
      </div>
    </GoogleOAuthProvider>
  );
}
