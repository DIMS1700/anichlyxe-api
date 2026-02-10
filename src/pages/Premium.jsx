import React, { useState } from 'react';
import { Crown, Check, MessageCircle, Copy } from 'lucide-react';
import { cn } from '../lib/utils';
import Layout from '../components/layout/Layout';

const FeatureItem = ({ text }) => (
  <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/5">
    <div className="bg-orange-500/20 p-1.5 rounded-full">
      <Check size={14} className="text-orange-500" strokeWidth={3} />
    </div>
    <span className="text-sm text-gray-200">{text}</span>
  </div>
);

const PlanCard = ({ title, price, originalPrice, period, isPopular, badgeText, features, isSelected, onSelect }) => (
  <div 
    onClick={onSelect}
    className={cn(
      "relative p-5 rounded-2xl border-2 transition-all duration-300 cursor-pointer overflow-hidden group",
      isSelected 
        ? "bg-[#1A1A1A] border-orange-500 shadow-xl shadow-orange-500/10" 
        : "bg-[#111111] border-white/10 hover:border-white/20"
    )}
  >
    {isPopular && (
      <div className="absolute top-0 right-0 bg-orange-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl uppercase tracking-wider">
        {badgeText || 'Paling Laris'}
      </div>
    )}
    
    <div className="flex justify-between items-start mb-4">
      <div>
        <h3 className={cn("text-lg font-bold mb-1", isSelected ? "text-orange-500" : "text-white")}>
          {title}
        </h3>
        <div className="flex flex-col">
          {originalPrice && (
            <span className="text-xs text-gray-500 line-through decoration-red-500 decoration-2">Rp {originalPrice}</span>
          )}
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold text-white">Rp {price}</span>
            <span className="text-xs text-gray-500">/{period}</span>
          </div>
        </div>
      </div>
      <div className={cn(
        "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors",
        isSelected ? "border-orange-500 bg-orange-500" : "border-gray-600"
      )}>
        {isSelected && <Check size={14} className="text-white" strokeWidth={3} />}
      </div>
    </div>

    <div className="space-y-2">
      {features.map((feature, idx) => (
        <div key={idx} className="flex items-center gap-2 text-xs text-gray-300">
          <Check size={14} className="text-green-500" strokeWidth={3} />
          {feature}
        </div>
      ))}
    </div>
  </div>
);

const Premium = () => {
  const [selectedPlan, setSelectedPlan] = useState('monthly');
  const [copied, setCopied] = useState(false);

  // NOMOR ADMIN BARU
  const ADMIN_NUMBER = '082216631335';
  const WA_LINK = `6282216631335`; // Format internasional tanpa +

  const handleCopy = () => {
    navigator.clipboard.writeText(ADMIN_NUMBER);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleBuy = () => {
    const plans = {
      weekly: { name: 'Paket Mingguan (7 Hari)', price: 'Rp 5.000' },
      monthly: { name: 'Paket Hemat (1 Bulan)', price: 'Rp 12.000' }
    };
    
    const plan = plans[selectedPlan];
    const message = `Halo Admin LyxeNime, saya sudah transfer ${plan.price} untuk pembelian ${plan.name}. Berikut bukti transfernya.`;
    window.open(`https://wa.me/${WA_LINK}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const commonFeatures = ['Bebas Iklan', 'Full HD 1080p', 'Download Unlimited', 'Badge Premium', 'Naik Level Cepat (2 Menit/XP)'];

  return (
    <Layout>
      <div className="min-h-screen pb-24">
        {/* Header Banner */}
        <div className="relative h-64 overflow-hidden rounded-b-[2.5rem] bg-gradient-to-b from-orange-600 to-orange-900 -mx-4 md:-mx-6 lg:-mx-8">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=2000&auto=format&fit=crop')] opacity-10 mix-blend-overlay bg-cover bg-center" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] to-transparent" />
          
          <div className="relative h-full flex flex-col items-center justify-center text-center px-6 pt-8">
            <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center mb-4 border border-white/20 shadow-2xl shadow-orange-500/30">
              <Crown size={32} className="text-yellow-400 fill-yellow-400" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">LyxeNime Premium</h1>
            <p className="text-orange-100/80 text-sm max-w-xs">
              Nikmati pengalaman nonton anime terbaik tanpa batas dan gangguan iklan.
            </p>
          </div>
        </div>

        <div className="px-2 -mt-8 relative z-10 space-y-6">
          {/* Plans */}
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider ml-1">
              Pilih Paket Kamu
            </h2>
            
            <div className="grid gap-4">
              <PlanCard 
                title="Paket Mingguan"
                price="5.000"
                period="7 hari"
                features={commonFeatures}
                isSelected={selectedPlan === 'weekly'}
                onSelect={() => setSelectedPlan('weekly')}
              />

              <PlanCard 
                title="Paket 1 Bulan"
                price="12.000"
                period="30 hari"
                features={commonFeatures}
                isSelected={selectedPlan === 'monthly'}
                onSelect={() => setSelectedPlan('monthly')}
              />
            </div>
          </div>

          {/* Payment Info */}
          <div className="bg-[#1A1A1A] p-5 rounded-2xl border border-white/10 space-y-4">
            <h3 className="text-white font-bold text-lg flex items-center gap-2">
              <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/7/72/Logo_dana_blue.svg/2560px-Logo_dana_blue.svg.png" alt="Dana" className="h-6" />
              Transfer Pembayaran
            </h3>
            
            <div className="bg-black/30 p-4 rounded-xl border border-white/5 flex items-center justify-between group">
              <div>
                <p className="text-xs text-gray-500 mb-1">Nomor Dana (Admin)</p>
                <p className="text-lg font-mono font-bold text-white tracking-wider">{ADMIN_NUMBER}</p>
              </div>
              <button 
                onClick={handleCopy}
                className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white relative"
              >
                {copied ? <Check size={20} className="text-green-500" /> : <Copy size={20} />}
                {copied && <span className="absolute -top-8 left-1/2 -translate-x-1/2 text-[10px] bg-green-500 text-white px-2 py-1 rounded">Copied!</span>}
              </button>
            </div>

            {/* QRIS Alternative */}
            <div className="bg-blue-900/10 border border-blue-500/10 p-4 rounded-xl">
              <h4 className="text-sm font-bold text-blue-400 mb-2">Dana Belum Premium?</h4>
              <p className="text-[10px] text-gray-400 mb-3">
                Gunakan metode <span className="font-bold text-white">QRIS</span> jika akun Dana kamu belum premium. Klik tombol di bawah untuk minta kode QRIS sesuai nominal paket.
              </p>
              <button 
                onClick={() => {
                  const plans = {
                    weekly: { name: 'Paket Mingguan (7 Hari)', price: 'Rp 5.000' },
                    monthly: { name: 'Paket Hemat (1 Bulan)', price: 'Rp 12.000' }
                  };
                  const plan = plans[selectedPlan];
                  const message = `Min saya mau beli premium lewat QRIS dengan nominal ${plan.price} (${plan.name})`;
                  window.open(`https://wa.me/${WA_LINK}?text=${encodeURIComponent(message)}`, '_blank');
                }}
                className="w-full bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-300 text-xs font-bold py-2.5 rounded-lg transition-all flex items-center justify-center gap-2"
              >
                <MessageCircle size={14} />
                Bayar via QRIS (WhatsApp)
              </button>
            </div>

            <div className="text-xs text-gray-400 space-y-2">
              <p>1. Salin nomor Dana di atas.</p>
              <p>2. Transfer sesuai nominal paket yang dipilih.</p>
              <p>3. Klik tombol di bawah untuk konfirmasi ke WhatsApp Admin.</p>
            </div>
          </div>

          {/* Action Button */}
          <div className="pt-2 pb-8">
            <button 
              onClick={handleBuy}
              className="w-full bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold py-4 rounded-xl shadow-lg shadow-green-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              <MessageCircle size={24} className="fill-white/20" />
              <span>Konfirmasi via WhatsApp</span>
            </button>
            <p className="text-center text-[10px] text-gray-600 mt-4">
              Admin akan memproses akun Premium kamu dalam 1x24 jam setelah bukti transfer diterima.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Premium;