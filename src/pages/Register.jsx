import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore"; 
import { auth, database } from '../lib/firebase'; // Menggunakan db dari firebase.js yang tadi kita buat
import { ref, set } from "firebase/database"; // Untuk Realtime DB
// Atau kalau pake Firestore: import { doc, setDoc } from "firebase/firestore";
// Sesuai rules tadi pake Firestore, jadi kita import Firestore

import { ArrowLeft, Mail, Lock, User, CheckCircle, Loader2 } from 'lucide-react';
import { getFirestore } from "firebase/firestore"; // Manual import firestore instance kalau belum ada di lib
import Layout from '../components/layout/Layout';

const Register = () => {
  const navigate = useNavigate();
  const db = getFirestore(); // Init Firestore

  // State
  const [step, setStep] = useState(1); // 1: Form, 2: OTP
  const [formData, setFormData] = useState({ username: '', email: '', password: '' });
  const [otpInput, setOtpInput] = useState('');
  const [serverOtp, setServerOtp] = useState(null); // OTP dari server untuk dicocokkan
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // 1. Kirim OTP
  const handleSendOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Panggil API Vercel Serverless Function
      const res = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email, username: formData.username })
      });

      const data = await res.json();

      if (data.success) {
        setServerOtp(data.otp); // Simpan OTP (idealnya di hash, tapi ini simple version)
        setStep(2);
      } else {
        setError('Gagal mengirim email verifikasi. Coba lagi.');
      }
    } catch (err) {
      console.error(err);
      setError('Terjadi kesalahan server.');
    } finally {
      setLoading(false);
    }
  };

  // 2. Verifikasi OTP & Buat Akun
  const handleVerifyAndRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (otpInput !== serverOtp) {
      setError('Kode OTP salah!');
      setLoading(false);
      return;
    }

    try {
      // 1. Create Auth User
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;

      // 2. Update Display Name
      await updateProfile(user, { displayName: formData.username });

      // 3. Simpan data user ke Firestore (sesuai rules)
      await setDoc(doc(db, "users", user.uid), {
        username: formData.username,
        email: formData.email,
        createdAt: new Date(),
        role: 'user',
        is_adult_verified: false
      });

      // Sukses
      navigate('/profile');
      
    } catch (err) {
      console.error(err);
      if (err.code === 'auth/email-already-in-use') {
        setError('Email sudah terdaftar.');
      } else {
        setError('Gagal membuat akun: ' + err.message);
      }
      // Jika gagal create akun tapi OTP bener, balikin ke step 1 biar user tau
      setStep(1); 
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
              <button onClick={() => navigate(-1)} className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors">
                  <ArrowLeft size={20} />
              </button>
              <div>
                  <h1 className="text-2xl font-bold text-white">Daftar Akun</h1>
                  <p className="text-xs text-gray-400">Bergabunglah dengan komunitas LyxeNime</p>
              </div>
          </div>

          {error && (
              <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-xl text-red-200 text-sm text-center">
                  {error}
              </div>
          )}

          {step === 1 ? (
              /* FORM REGISTER */
              <form onSubmit={handleSendOtp} className="space-y-4">
                  
                  {/* WARNING PASSOWRD */}
                  <div className="bg-red-900/20 border border-red-500/30 p-4 rounded-xl mb-2">
                     <p className="text-xs text-red-400 font-extrabold text-center leading-relaxed tracking-wide">
                       Demi keamanan, gunakan password baru yang unik dan jangan samakan dengan password email pribadi Anda.
                     </p>
                  </div>

                  <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-400 ml-1">Username</label>
                      <div className="relative">
                          <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                          <input 
                              type="text" 
                              name="username"
                              required
                              value={formData.username}
                              onChange={handleChange}
                              placeholder="Wibu Sejati" 
                              className="w-full bg-[#27272a] border border-transparent focus:border-orange-500 rounded-xl py-3 pl-12 pr-4 text-sm text-white focus:outline-none transition-all"
                          />
                      </div>
                  </div>

                  <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-400 ml-1">Email</label>
                      <div className="relative">
                          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                          <input 
                              type="email" 
                              name="email"
                              required
                              value={formData.email}
                              onChange={handleChange}
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
                              name="password"
                              required
                              value={formData.password}
                              onChange={handleChange}
                              placeholder="••••••••" 
                              className="w-full bg-[#27272a] border border-transparent focus:border-orange-500 rounded-xl py-3 pl-12 pr-4 text-sm text-white focus:outline-none transition-all"
                          />
                      </div>
                  </div>

                  <button 
                      type="submit" 
                      disabled={loading}
                      className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3.5 rounded-xl transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 mt-4"
                  >
                      {loading ? <Loader2 className="animate-spin" size={20} /> : 'Kirim Kode Verifikasi'}
                  </button>
              </form>
          ) : (
              /* FORM OTP */
              <form onSubmit={handleVerifyAndRegister} className="space-y-6 animate-in fade-in slide-in-from-right-10">
                  <div className="text-center">
                      <div className="w-16 h-16 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Mail className="text-orange-500" size={32} />
                      </div>
                      <h3 className="text-lg font-bold">Cek Email Anda</h3>
                      <p className="text-sm text-gray-400 mt-1">
                          Kami telah mengirimkan kode OTP ke <br/><span className="text-white font-mono">{formData.email}</span>
                      </p>
                  </div>

                  <div className="space-y-2">
                      <input 
                          type="text" 
                          required
                          maxLength={6}
                          value={otpInput}
                          onChange={(e) => setOtpInput(e.target.value.replace(/[^0-9]/g, ''))}
                          placeholder="000000" 
                          className="w-full bg-[#27272a] border border-orange-500/50 text-center text-3xl font-mono tracking-[0.5em] rounded-xl py-4 text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                  </div>

                  <button 
                      type="submit" 
                      disabled={loading}
                      className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3.5 rounded-xl transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                      {loading ? <Loader2 className="animate-spin" size={20} /> : 'Verifikasi & Daftar'}
                  </button>

                  <button 
                      type="button" 
                      onClick={() => setStep(1)}
                      className="w-full text-sm text-gray-500 hover:text-white"
                  >
                      Bukan email ini? Kembali
                  </button>
              </form>
          )}

          {step === 1 && (
              <div className="mt-8 text-center text-sm text-gray-500">
                  Sudah punya akun? <Link to="/login" className="text-orange-500 font-bold hover:underline">Masuk</Link>
              </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Register;
