import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock, PlayCircle } from 'lucide-react';
import Layout from '../components/layout/Layout';

const Schedule = () => {
  const [scheduleData, setScheduleData] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeDay, setActiveDay] = useState("");
  const [days, setDays] = useState([]);

  // Mapping Hari: Karena API biasanya menggunakan bahasa Inggris (Monday, dst) 
  // atau format tertentu, kita sesuaikan mapping-nya agar sinkron dengan UI.
  const dayOrder = ["SENIN", "SELASA", "RABU", "KAMIS", "JUMAT", "SABTU", "MINGGU"];
  
  // Helper untuk mengubah key API (English) ke UI (Indonesia)
  const apiToUiMap = {
    "Monday": "SENIN",
    "Tuesday": "SELASA",
    "Wednesday": "RABU",
    "Thursday": "KAMIS",
    "Friday": "JUMAT",
    "Saturday": "SABTU",
    "Sunday": "MINGGU"
  };

  useEffect(() => {
    const fetchSchedule = async () => {
      const CACHE_KEY = 'schedule_data_v1'; // Update key agar cache segar
      const CACHE_EXPIRY = 30 * 60 * 1000;

      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        try {
          const { data, timestamp } = JSON.parse(cached);
          if (Date.now() - timestamp < CACHE_EXPIRY) {
            processData(data);
            setLoading(false);
            return;
          }
        } catch (e) {
          localStorage.removeItem(CACHE_KEY);
        }
      }

      try {
        // PERBAIKAN URL: Pastikan ada slash (/) sebelum api/schedule
        const response = await fetch('https://animein.vercel.app/api/schedule');
        const data = await response.json();
        
        localStorage.setItem(CACHE_KEY, JSON.stringify({
            data: data,
            timestamp: Date.now()
        }));
        
        processData(data);
      } catch (err) {
        console.error("Error fetching schedule:", err);
      } finally {
        setLoading(false);
      }
    };

    const processData = (data) => {
        // API Penjual mengembalikan objek { Monday: [], Tuesday: [], ... }
        // Kita transformasi agar Key-nya menjadi bahasa Indonesia sesuai dayOrder
        const formattedData = {};
        
        Object.keys(data).forEach(dayKey => {
          const uiDayName = apiToUiMap[dayKey] || dayKey.toUpperCase();
          formattedData[uiDayName] = data[dayKey];
        });

        setScheduleData(formattedData);
        
        // Ambil hari yang tersedia di data
        const availableDays = Object.keys(formattedData).filter(key => dayOrder.includes(key));
        availableDays.sort((a, b) => dayOrder.indexOf(a) - dayOrder.indexOf(b));
        setDays(availableDays);

        // Set default active day (Hari ini)
        if (!activeDay) { 
            const todayEng = new Date().toLocaleDateString('en-US', { weekday: 'long' });
            const todayUi = apiToUiMap[todayEng];
            
            if (availableDays.includes(todayUi)) {
                setActiveDay(todayUi);
            } else if (availableDays.length > 0) {
                setActiveDay(availableDays[0]);
            }
        }
    };

    fetchSchedule();
  }, [activeDay]); 

  const activeAnimeList = scheduleData[activeDay] || [];

  return (
    <Layout>
      <div className="min-h-screen bg-[#111111] text-white pb-24 font-sans">
        
        {/* Header Minimalis */}
        <div className="sticky top-0 z-40 bg-[#111111]/95 backdrop-blur-md border-b border-white/5 py-4 px-4 shadow-lg">
           <div className="max-w-7xl mx-auto">
              <div className="flex items-center gap-3 mb-4">
                 <div className="p-2 bg-orange-500/10 rounded-lg border border-orange-500/20">
                    <Calendar className="text-orange-500" size={20} />
                 </div>
                 <h1 className="text-lg font-bold text-white">
                    Jadwal Rilis
                 </h1>
              </div>

              {/* Day Selector (Tabs) */}
              <div className="flex gap-2 overflow-x-auto no-scrollbar snap-x">
                 {loading ? (
                    [1,2,3,4,5,6,7].map(i => (
                        <div key={i} className="flex-shrink-0 w-20 h-8 bg-white/5 rounded-full animate-pulse"></div>
                    ))
                 ) : (
                    days.map((day) => {
                       const isActive = activeDay === day;
                       return (
                          <button
                             key={day}
                             onClick={() => setActiveDay(day)}
                             className={`
                                snap-start flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-300 border
                                ${isActive 
                                   ? 'bg-orange-600 text-white border-orange-500 shadow-md shadow-orange-500/20' 
                                   : 'bg-[#18181b] text-gray-400 border-white/5 hover:bg-[#27272a] hover:text-white'
                                }
                             `}
                          >
                             {day}
                          </button>
                       );
                    })
                 )}
              </div>
           </div>
        </div>

        {/* Content Grid */}
        <div className="max-w-7xl mx-auto px-4 py-6">
           {loading ? (
              <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                 {[1,2,3,4,5,6,7,8,9,10,11,12].map(i => (
                    <div key={i} className="aspect-[3/4] bg-white/5 rounded-xl animate-pulse"></div>
                 ))}
              </div>
           ) : activeAnimeList.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 bg-[#18181b] rounded-2xl border border-dashed border-white/10 mx-4">
                 <Calendar size={32} className="text-gray-600 mb-2 opacity-50" />
                 <p className="text-gray-500 text-sm">Tidak ada jadwal tayang hari ini.</p>
              </div>
           ) : (
              <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
                 {activeAnimeList.map((anime) => (
                    <Link 
                       to={`/detail/${anime.id}`} 
                       key={anime.id}
                       className="group relative bg-[#18181b] rounded-xl overflow-hidden border border-white/5 hover:border-orange-500/40 transition-all duration-300 hover:shadow-lg hover:shadow-orange-500/10"
                    >
                       <div className="aspect-[3/4] overflow-hidden relative">
                          <img 
                             src={anime.image_poster || anime.image} 
                             alt={anime.title} 
                             className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                             loading="lazy"
                          />
                          
                          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />
                          
                          <div className="absolute top-1.5 right-1.5">
                             <div className="flex items-center gap-1 px-1.5 py-0.5 bg-black/70 backdrop-blur-sm border border-white/10 rounded text-[9px] font-bold text-orange-300">
                                <Clock size={8} />
                                <span>{anime.key_time || '??:??'}</span>
                             </div>
                          </div>

                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 scale-75 group-hover:scale-100">
                             <div className="w-8 h-8 bg-orange-600 rounded-full flex items-center justify-center shadow-lg text-white">
                                <PlayCircle size={16} fill="white" />
                             </div>
                          </div>
                       </div>

                       <div className="absolute bottom-0 left-0 right-0 p-2.5">
                          <h3 className="text-white text-xs font-bold leading-tight line-clamp-2 mb-1 group-hover:text-orange-400 transition-colors">
                             {anime.title}
                          </h3>
                          <p className="text-[9px] text-gray-500 line-clamp-1">
                             {anime.genre || anime.type}
                          </p>
                       </div>
                    </Link>
                 ))}
              </div>
           )}
        </div>
      </div>
    </Layout>
  );
};

export default Schedule;