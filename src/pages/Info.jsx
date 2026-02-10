import React, { useState } from 'react';
import Layout from '../components/layout/Layout';
import { Info, Shield, FileText, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';

const InfoPage = () => {
  const [activeSection, setActiveSection] = useState('about');

  const sections = [
    {
      id: 'about',
      title: 'Tentang LyxeNime',
      icon: <Info size={18} className="text-blue-500" />,
      content: (
        <div className="space-y-3 text-sm text-gray-300 leading-relaxed">
          <p>
            <strong className="text-white">LyxeNime</strong> adalah platform streaming anime dan baca manga gratis yang dibuat oleh penggemar untuk penggemar. Kami menyediakan ribuan judul anime dari berbagai genre dengan subtitle Bahasa Indonesia yang berkualitas.
          </p>
          <p>
            Tujuan kami adalah memberikan pengalaman menonton anime terbaik, tercepat, dan termudah bagi komunitas wibu di Indonesia tanpa biaya berlangganan yang mahal.
          </p>
          <p>
            Dibuat dengan <span className="text-red-500">♥</span> oleh <strong>Dimas</strong>.
          </p>
        </div>
      )
    },
    {
      id: 'tos',
      title: 'Syarat & Ketentuan',
      icon: <FileText size={18} className="text-green-500" />,
      content: (
        <div className="space-y-3 text-sm text-gray-300 leading-relaxed">
          <ul className="list-disc pl-5 space-y-2">
            <li>Pengguna wajib menjaga kesopanan dalam berkomentar.</li>
            <li>Dilarang melakukan spam, promosi judi, atau konten SARA di kolom komentar.</li>
            <li>Kami berhak memblokir pengguna yang melanggar aturan tanpa peringatan.</li>
            <li>Konten yang tersedia di sini diambil dari berbagai sumber pihak ketiga. Kualitas dan ketersediaan server streaming di luar kendali kami.</li>
            <li>Penggunaan fitur Premium (jika ada) adalah bentuk donasi sukarela untuk operasional server.</li>
          </ul>
        </div>
      )
    },
    {
      id: 'privacy',
      title: 'Kebijakan Privasi & Keamanan',
      icon: <Shield size={18} className="text-orange-500" />,
      content: (
        <div className="space-y-4 text-sm text-gray-300 leading-relaxed">
          <div className="bg-green-500/10 border border-green-500/20 p-4 rounded-xl flex items-start gap-3">
             <div className="p-2 bg-green-500/20 rounded-full text-green-500 mt-1">
                 <Shield size={20} />
             </div>
             <div>
                 <h4 className="font-bold text-green-400 text-base mb-1">Enkripsi End-to-End</h4>
                 <p className="text-xs text-green-200/80">
                    Sistem keamanan kami menggunakan standar enkripsi militer. Data Anda dikunci rapat sejak dari perangkat Anda hingga ke server.
                 </p>
             </div>
          </div>

          <p>
            Privasi adalah harga mati di LyxeNime. Kami menjamin bahwa seluruh data sensitif pengguna (Email, Password, Token Login) tersimpan dengan enkripsi <strong>End-to-End</strong>.
          </p>
          
          <ul className="list-disc pl-5 space-y-2 marker:text-orange-500">
            <li>
                <strong>Admin Tidak Bisa Mengakses:</strong> Kunci enkripsi hanya dipegang oleh user. <span className="text-white font-bold">Bahkan Admin LyxeNime sendiri TIDAK BISA membaca atau melihat password dan data pribadi Anda.</span>
            </li>
            <li>
                <strong>Anti-Bocor:</strong> Database kami dilindungi firewall berlapis untuk mencegah kebocoran data pihak ketiga.
            </li>
            <li>
                <strong>Anonimitas:</strong> Kami tidak melacak lokasi fisik atau identitas asli Anda di dunia nyata.
            </li>
          </ul>
          
          <p className="text-xs text-gray-500 italic mt-2">
            "Keamanan data Anda adalah prioritas tertinggi kami."
          </p>
        </div>
      )
    },
    {
      id: 'disclaimer',
      title: 'Disclaimer (DMCA)',
      icon: <AlertTriangle size={18} className="text-yellow-500" />,
      content: (
        <div className="space-y-3 text-sm text-gray-300 leading-relaxed">
          <p>
            LyxeNime tidak menyimpan file video di server sendiri. Semua konten yang ditampilkan di situs ini disediakan oleh pihak ketiga non-afiliasi.
          </p>
          <p>
            Jika Anda pemilik hak cipta dan merasa konten Anda dilanggar, silakan hubungi penyedia hosting video terkait (seperti Google Drive, Doodstream, Blogger, dll) untuk penghapusan konten.
          </p>
          <p>
            Kami hanya bertindak sebagai mesin pencari/indeks yang memudahkan pengguna menemukan konten yang tersedia secara publik di internet.
          </p>
        </div>
      )
    }
  ];

  return (
    <Layout>
      <div className="min-h-screen pb-10 pt-4">
        {/* Header */}
        <div className="text-center mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
            <h1 className="text-2xl font-black text-white mb-1">Informasi Website</h1>
            <p className="text-xs text-gray-400">Semua yang perlu kamu tahu tentang LyxeNime</p>
        </div>

        {/* Accordion List */}
        <div className="space-y-4 max-w-xl mx-auto px-2">
            {sections.map((section, index) => (
                <div 
                    key={section.id}
                    className="bg-[#18181b] border border-white/5 rounded-xl overflow-hidden transition-all duration-300 hover:border-white/10"
                >
                    <button 
                        onClick={() => setActiveSection(activeSection === section.id ? null : section.id)}
                        className="w-full flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 transition-colors text-left"
                    >
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-[#111] rounded-lg border border-white/5">
                                {section.icon}
                            </div>
                            <span className="font-bold text-white text-sm">{section.title}</span>
                        </div>
                        {activeSection === section.id ? (
                            <ChevronUp size={18} className="text-gray-400" />
                        ) : (
                            <ChevronDown size={18} className="text-gray-400" />
                        )}
                    </button>
                    
                    {/* Content with Animation */}
                    <div 
                        className={`overflow-hidden transition-all duration-300 ease-in-out ${
                            activeSection === section.id ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
                        }`}
                    >
                        <div className="p-5 border-t border-white/5 bg-[#111111]/50">
                            {section.content}
                        </div>
                    </div>
                </div>
            ))}
        </div>
        
        <div className="text-center mt-12 text-[10px] text-gray-600">
            &copy; 2026 LyxeNime • v2.0.0 Stable
        </div>
      </div>
    </Layout>
  );
};

export default InfoPage;
