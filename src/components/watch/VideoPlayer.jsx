import React, { useState, useEffect, useRef } from 'react';
import { Settings, Play, Pause, Maximize, RotateCcw, RotateCw, SkipBack, SkipForward } from 'lucide-react';

const formatTime = (timeInSeconds) => {
  if (isNaN(timeInSeconds)) return "00:00";
  const minutes = Math.floor(timeInSeconds / 60);
  const seconds = Math.floor(timeInSeconds % 60);
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

const VideoPlayer = ({ activeServer, onServerChange, poster, servers = [], storageKey, animeTitle, onNext, onPrev }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isIframe, setIsIframe] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [showServerList, setShowServerList] = useState(false);
  const [showResumeToast, setShowResumeToast] = useState(false);

  const videoRef = useRef(null);
  const controlsTimeoutRef = useRef(null);
  const containerRef = useRef(null);
  const speedMenuRef = useRef(null);
  const serverListRef = useRef(null);

  // Initialize/Update server type when activeServer changes
  useEffect(() => {
    if (activeServer) {
        const isDirect = /\.(mp4|m3u8|webm|ogg)($|\?)/i.test(activeServer.link);
        setIsIframe(!isDirect);
        setHasError(false);
        // Reset player state
        setIsPlaying(false);
        setCurrentTime(0);
        setBuffered(0);
        setPlaybackRate(1); // Reset speed to Normal
        setShowSpeedMenu(false);
        setShowServerList(false);
        setShowResumeToast(false);
    }
  }, [activeServer]);

  // Handle click outside menus
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (speedMenuRef.current && !speedMenuRef.current.contains(event.target)) {
        setShowSpeedMenu(false);
      }
      if (serverListRef.current && !serverListRef.current.contains(event.target)) {
        setShowServerList(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, []);

  // Auto-hide controls (Only for non-iframe)
  useEffect(() => {
    if (!isIframe && showControls && isPlaying && !isDragging && !showSpeedMenu && !showServerList) {
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }
    return () => clearTimeout(controlsTimeoutRef.current);
  }, [showControls, isPlaying, isDragging, isIframe, showSpeedMenu, showServerList]);


  const togglePlay = (e) => {
    if (isIframe) return; // Iframe handles its own playback
    if (e) e.stopPropagation();
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setShowControls(true);
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const skip = (seconds, e) => {
    if (isIframe) return;
    if (e) e.stopPropagation();
    if (videoRef.current) {
      videoRef.current.currentTime += seconds;
      setShowControls(true);
    }
  };

  const changePlaybackRate = (rate, e) => {
    e.stopPropagation();
    setPlaybackRate(rate);
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
    }
    setShowSpeedMenu(false);
  };

  const handleTimeUpdate = () => {
    if (videoRef.current && !isDragging) {
      const cTime = videoRef.current.currentTime;
      setCurrentTime(cTime);
      
      if (storageKey && cTime > 5) {
          localStorage.setItem(`vid_prog_${storageKey}`, cTime);
          if (duration > 0) {
              const pct = Math.floor((cTime / duration) * 100);
              localStorage.setItem(`vid_pct_${storageKey}`, pct);
          }
      }

      if (videoRef.current.buffered.length > 0) {
        setBuffered(videoRef.current.buffered.end(videoRef.current.buffered.length - 1));
      }
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
      
      if (storageKey) {
          const savedTime = localStorage.getItem(`vid_prog_${storageKey}`);
          if (savedTime) {
              const time = parseFloat(savedTime);
              if (time > 0 && time < (videoRef.current.duration * 0.95)) {
                  videoRef.current.currentTime = time;
                  setShowResumeToast(true);
                  setTimeout(() => setShowResumeToast(false), 3000);
              }
          }
      }
    }
  };

  const handleEnded = () => {
      if (storageKey) {
          localStorage.removeItem(`vid_prog_${storageKey}`);
      }
      setIsPlaying(false);
      setShowControls(true);
  };

  const handleError = () => {
    if (!isIframe) {
        console.log("Video tag failed, falling back to Iframe...");
        setIsIframe(true);
    } else {
        console.error("Both Video and Iframe failed.");
        setHasError(true);
    }
  };

  const handleSeek = (e) => {
    e.stopPropagation();
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
    if (videoRef.current) {
      videoRef.current.currentTime = newTime;
    }
  };

  const handleSeekStart = () => {
    setIsDragging(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
  };

  const handleSeekEnd = () => {
    setIsDragging(false);
    if (isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }
  };

  const handleContainerClick = () => {
    if (isIframe) return;
    setShowControls((prev) => !prev);
  };

  // Handle Screen Orientation on Fullscreen
  useEffect(() => {
    const handleFullscreenChange = async () => {
      try {
        if (document.fullscreenElement) {
          // Masuk Fullscreen -> Paksa Landscape
          if (screen.orientation && screen.orientation.lock) {
            await screen.orientation.lock('landscape').catch((e) => console.log('Rotation lock prevented:', e));
          }
        } else {
          // Keluar Fullscreen -> Balikin Portrait/Auto
          if (screen.orientation && screen.orientation.unlock) {
            screen.orientation.unlock();
          }
          // FORCE LAYOUT RECALCULATION (Fix bug webview gepeng/kecil)
          setTimeout(() => {
              window.dispatchEvent(new Event('resize'));
          }, 100);
        }
      } catch (error) {
        console.log("Screen orientation API not supported", error);
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = (e) => {
    e.stopPropagation();

    // 1. Standard Fullscreen (Android, PC, iPadOS)
    if (document.fullscreenEnabled || document.webkitFullscreenEnabled) {
        if (!document.fullscreenElement && !document.webkitFullscreenElement) {
            // Enter Fullscreen
            if (containerRef.current.requestFullscreen) {
                containerRef.current.requestFullscreen().then(() => {
                    if (screen.orientation && screen.orientation.lock) {
                        screen.orientation.lock('landscape').catch((e) => console.log('Lock failed:', e));
                    }
                });
            } else if (containerRef.current.webkitRequestFullscreen) {
                containerRef.current.webkitRequestFullscreen();
            }
        } else {
            // Exit Fullscreen
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            }
        }
    } 
    // 2. iOS iPhone Native Fullscreen (Video Element Only)
    else if (videoRef.current && videoRef.current.webkitEnterFullscreen) {
        videoRef.current.webkitEnterFullscreen();
    }
  };

  if (!activeServer) return <div className="aspect-video bg-black flex items-center justify-center text-gray-500">Loading Server...</div>;

  return (
    <div ref={containerRef} className="relative w-full aspect-video bg-black group overflow-hidden select-none" onClick={handleContainerClick}>
      
      {hasError ? (
          <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-900 text-white gap-4">
              <p className="text-red-400">Gagal memuat video dari server ini.</p>
              <div className="flex gap-2">
                  <button onClick={() => window.open(activeServer.link, '_blank')} className="px-4 py-2 bg-zinc-800 rounded-lg text-sm hover:bg-zinc-700">
                      Buka di Tab Baru
                  </button>
              </div>
          </div>
      ) : isIframe ? (
          <iframe 
            key={activeServer.link}
            src={activeServer.link} 
            className="w-full h-full border-0" 
            allowFullScreen 
            allow="autoplay; encrypted-media; picture-in-picture"
            title="Video Player"
          />
      ) : (
          <video
            key={activeServer.link}
            ref={videoRef}
            src={activeServer.link}
            poster={poster}
            className="w-full h-full object-contain"
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onEnded={handleEnded}
            onError={handleError}
            playsInline
          />
      )}
      
      {/* Controls Overlay */}
      {(!isIframe && !hasError) && (
      <div className={`absolute inset-0 z-20 flex flex-col justify-between transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
        
        {/* Top Overlay - Empty now as settings moved */}
        <div className="flex justify-between items-start p-4 bg-gradient-to-b from-black/80 to-transparent relative pointer-events-none">
           <div className="flex-1 mr-4 pointer-events-auto">
               <h3 className="text-white font-bold text-sm md:text-lg line-clamp-1 drop-shadow-md">{animeTitle}</h3>
           </div>
           {showResumeToast && (
               <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/80 px-4 py-2 rounded-full text-xs font-bold text-white border border-violet-500/50 animate-in fade-in slide-in-from-top-2">
                   Melanjutkan video...
               </div>
           )}
        </div>

        {/* Center Controls */}
        <div className="absolute inset-0 flex items-center justify-center gap-12 pointer-events-none">
           <button onClick={(e) => skip(-10, e)} className="pointer-events-auto p-2 text-white hover:text-violet-500 transition-transform active:scale-95">
             <RotateCcw size={32} />
           </button>
           
           <button onClick={togglePlay} className="pointer-events-auto transition-transform active:scale-95">
             {isPlaying ? (
                 <Pause size={64} fill="white" className="text-white" />
             ) : (
                 <Play size={64} fill="white" className="text-white" />
             )}
           </button>

           <button onClick={(e) => skip(10, e)} className="pointer-events-auto p-2 text-white hover:text-violet-500 transition-transform active:scale-95">
             <RotateCw size={32} />
           </button>
        </div>

        {/* Bottom Controls */}
        <div className="px-4 pb-4 pt-12 bg-gradient-to-t from-black/80 to-transparent" onClick={(e) => e.stopPropagation()}>
             {/* Progress Bar */}
             <div className="relative w-full h-1 bg-gray-600 rounded-full cursor-pointer mb-2 group/slider flex items-center">
                  {/* Buffer */}
                  <div 
                    className="absolute h-full bg-gray-400 rounded-full"
                    style={{ width: `${(buffered / duration) * 100}%` }}
                  ></div>
                  {/* Progress */}
                  <div 
                    className="absolute h-full bg-violet-500 rounded-full"
                    style={{ width: `${(currentTime / duration) * 100}%` }}
                  ></div>
                  {/* Handle (violet Circle) */}
                  <div 
                    className="absolute h-3 w-3 bg-violet-500 rounded-full shadow pointer-events-none"
                    style={{ left: `${(currentTime / duration) * 100}%`, transform: 'translateX(-50%)' }}
                  ></div>
                  
                  {/* Input Range for Interaction */}
                  <input
                    type="range"
                    min="0"
                    max={duration || 100}
                    step="0.1"
                    value={currentTime}
                    onChange={handleSeek}
                    onMouseDown={handleSeekStart}
                    onMouseUp={handleSeekEnd}
                    onTouchStart={handleSeekStart}
                    onTouchEnd={handleSeekEnd}
                    className="absolute w-full h-full opacity-0 cursor-pointer z-10"
                  />
             </div>

             <div className="flex items-center justify-between text-white text-sm font-medium">
                 <div className="flex items-center gap-4">
                     {/* Nav Controls */}
                     <div className="flex items-center gap-2">
                        <button 
                            onClick={(e) => { e.stopPropagation(); if(onPrev) onPrev(); }} 
                            disabled={!onPrev}
                            className={`transition-colors ${onPrev ? 'hover:text-violet-500 text-white' : 'text-gray-600 cursor-default'}`}
                            title="Previous Episode"
                        >
                            <SkipBack size={20} fill={onPrev ? "white" : "gray"} className={onPrev ? "text-white" : "text-gray-600"} />
                        </button>
                        <button 
                            onClick={(e) => { e.stopPropagation(); if(onNext) onNext(); }} 
                            disabled={!onNext}
                            className={`transition-colors ${onNext ? 'hover:text-violet-500 text-white' : 'text-gray-600 cursor-default'}`}
                            title="Next Episode"
                        >
                            <SkipForward size={20} fill={onNext ? "white" : "gray"} className={onNext ? "text-white" : "text-gray-600"} />
                        </button>
                     </div>

                     <span>{formatTime(currentTime)}</span>
                 </div>
                 
                 <div className="flex items-center gap-3">
                     <span>{formatTime(duration)}</span>
                     
                     {/* Server Control (Internal) */}
                     {servers && servers.length > 0 && (
                         <div className="relative" ref={serverListRef}>
                            {showServerList && (
                                <div className="absolute bottom-full right-0 mb-2 bg-black/90 rounded-lg overflow-hidden flex flex-col min-w-[140px] max-h-60 overflow-y-auto text-left shadow-lg border border-white/10 z-30">
                                    <div className="px-3 py-2 text-xs font-bold text-gray-400 border-b border-white/10">Pilih Kualitas</div>
                                    {servers.map((server, idx) => (
                                        <button
                                            key={`${server.quality}-${idx}`}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onServerChange(server);
                                                setShowServerList(false);
                                            }}
                                            className={`px-3 py-2 text-sm hover:bg-white/20 transition-colors flex items-center justify-between gap-2 ${activeServer === server ? 'text-violet-500 font-bold' : 'text-white'}`}
                                        >
                                            <span>{server.quality}</span>
                                            {activeServer === server && <div className="w-1.5 h-1.5 rounded-full bg-violet-500"></div>}
                                        </button>
                                    ))}
                                </div>
                            )}
                             <button 
                                onClick={(e) => { e.stopPropagation(); setShowServerList(!showServerList); }}
                                className="hover:text-violet-500 transition-colors text-white"
                             >
                                 <Settings size={20} />
                             </button>
                         </div>
                     )}

                     {/* Speed Control */}
                     <div className="relative" ref={speedMenuRef}>
                        {showSpeedMenu && (
                          <div className="absolute bottom-full right-0 mb-2 bg-black/90 rounded-lg overflow-hidden flex flex-col min-w-[80px] text-center shadow-lg border border-white/10 z-30">
                            {[2.0, 1.5, 1.25, 1.0, 0.75, 0.5].map((rate) => (
                              <button
                                key={rate}
                                onClick={(e) => changePlaybackRate(rate, e)}
                                className={`px-4 py-2 text-sm hover:bg-white/20 transition-colors ${playbackRate === rate ? 'text-violet-500 font-bold' : 'text-white'}`}
                              >
                                {rate === 1.0 ? 'Normal' : `${rate}x`}
                              </button>
                            ))}
                          </div>
                        )}
                        <button 
                          onClick={(e) => { e.stopPropagation(); setShowSpeedMenu(!showSpeedMenu); }}
                          className="text-white hover:text-violet-500 transition-colors text-sm font-medium min-w-[30px]"
                        >
                          {playbackRate === 1 ? '1x' : `${playbackRate}x`}
                        </button>
                     </div>

                     <button onClick={toggleFullscreen} className="hover:text-violet-500 transition-colors">
                         <Maximize size={20} />
                     </button>
                 </div>
             </div>
        </div>
      </div>
      )}
    </div>
  );
};

export default VideoPlayer;