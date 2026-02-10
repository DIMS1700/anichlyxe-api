import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from '../lib/firebase';
import { ArrowLeft, Mail, Lock, Loader2 } from 'lucide-react';
import Layout from '../components/layout/Layout';

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/profile'); // Redirect ke profil setelah login
    } catch (err) {
      console.error(err);
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setError('Email atau password salah.');
      } else if (err.code === 'auth/too-many-requests') {
        setError('Terlalu banyak percobaan. Coba lagi nanti.');
      } else {
        setError('Gagal masuk: ' + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="min-h-screen bg-[#111111] flex flex-col items-center justify-center p-4 font-sans text-white">
        <div className="w-full max-w-md bg-[#18181b] p-6 rounded-2xl border border-white/5 shadow-2xl">
          
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
              {/* PERBAIKAN DI SINI: navigate('/') agar pasti ke Home */}
              <button onClick={() => navigate('/')} className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors">
                  <ArrowLeft size={20} />
              </button>
              <div>
                  <h1 className="text-2xl font-bold text-white">Selamat Datang</h1>
                  <p className="text-xs text-gray-400">Silakan masuk untuk melanjutkan</p>
              </div>
          </div>

          {error && (
              <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-xl text-red-200 text-sm text-center">
                  {error}
              </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-400 ml-1">Email</label>
                  <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                      <input 
                          type="email" 
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="email@contoh.com" 
                          className="w-full bg-[#27272a] border border-transparent focus:border-orange-500 rounded-xl py-3 pl-12 pr-4 text-sm text-white focus:outline-none transition-all"
                      />
                  </div>
              </div>

              <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-400 ml-1">Password</label>
                  <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                      <input 
                          type="password" 
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••" 
                          className="w-full bg-[#27272a] border border-transparent focus:border-orange-500 rounded-xl py-3 pl-12 pr-4 text-sm text-white focus:outline-none transition-all"
                      />
                  </div>
              </div>

              <div className="text-right">
                  <a href="#" className="text-xs text-gray-400 hover:text-white">Lupa password?</a>
              </div>

              <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3.5 rounded-xl transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
              >
                  {loading ? <Loader2 className="animate-spin" size={20} /> : 'Masuk Sekarang'}
              </button>
          </form>

          <div className="mt-8 text-center text-sm text-gray-500">
              Belum punya akun? <Link to="/register" className="text-orange-500 font-bold hover:underline">Daftar</Link>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Login;