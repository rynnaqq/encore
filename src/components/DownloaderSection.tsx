import React, { useState } from 'react';
import { Download, Youtube, Instagram, Facebook, Video, AlertCircle, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export function DownloaderSection() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any | null>(null);

  const handleDownload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // First attempt to call our internal API
      const response = await fetch('/api/download', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ url })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch video information');
      }

      setResult(data);
    } catch (err: any) {
      console.error("Downloader Error:", err);
      setError(err.message || 'Platform not supported or service unavailable.');
    } finally {
      setLoading(false);
    }
  };

  const getIcon = () => {
    if (url.includes('youtube.com') || url.includes('youtu.be')) return <Youtube className="w-5 h-5 text-red-500" />;
    if (url.includes('tiktok.com')) return <Video className="w-5 h-5 text-slate-800 dark:text-white" />;
    if (url.includes('instagram.com')) return <Instagram className="w-5 h-5 text-rose-500" />;
    if (url.includes('facebook.com') || url.includes('fb.watch')) return <Facebook className="w-5 h-5 text-blue-600" />;
    return <Video className="w-5 h-5 text-slate-400" />;
  };

  return (
    <section className="min-h-screen py-24 px-4 sm:px-6 relative overflow-hidden bg-white">
      {/* Decorative background */}
      <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-br from-[#FFF5D7] via-rose-50 to-white -z-10 rounded-b-[100px] opacity-70" />
      
      <div className="max-w-4xl mx-auto space-y-12">
        <div className="text-center space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center justify-center p-3 bg-rose-100 text-rose-500 rounded-2xl shadow-sm mb-4"
          >
            <Download className="w-8 h-8" />
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl font-black text-slate-800 tracking-tight"
          >
            Universal Media Downloader
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg text-slate-500 max-w-2xl mx-auto leading-relaxed"
          >
            Download high-quality videos and audio from YouTube, TikTok, Instagram, and Facebook for free.
          </motion.p>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white/80 backdrop-blur-xl p-8 rounded-[2rem] shadow-xl border border-slate-100 max-w-3xl mx-auto"
        >
          <form onSubmit={handleDownload} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                {getIcon()}
              </div>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Paste your video link here (YouTube, TikTok, Instagram, Facebook)..."
                required
                className="w-full pl-12 pr-4 py-4 sm:py-5 bg-slate-50 border-2 border-slate-200 rounded-2xl text-slate-800 focus:outline-none focus:border-[#E195AB] focus:bg-white transition-all text-base sm:text-lg shadow-inner truncate"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto py-4 sm:py-5 px-8 bg-[#E195AB] hover:bg-rose-400 text-white font-bold rounded-2xl shadow-md transition-all active:scale-95 disabled:opacity-70 flex items-center justify-center min-w-[140px]"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <span>Download</span>
              )}
            </button>
          </form>

          {/* Supported Platforms */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-slate-400 font-medium">
            <div className="flex items-center gap-2">
              <Youtube className="w-4 h-4 text-slate-400" />
              <span>YouTube</span>
            </div>
            <div className="flex items-center gap-2">
              <Video className="w-4 h-4 text-slate-400" />
              <span>TikTok</span>
            </div>
            <div className="flex items-center gap-2">
              <Instagram className="w-4 h-4 text-slate-400" />
              <span>Instagram</span>
            </div>
            <div className="flex items-center gap-2">
              <Facebook className="w-4 h-4 text-slate-400" />
              <span>Facebook</span>
            </div>
          </div>
        </motion.div>

        {/* Results Section */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="max-w-3xl mx-auto overflow-hidden"
            >
              <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded-r-xl flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-amber-800 font-medium leading-relaxed">{error}</p>
              </div>
            </motion.div>
          )}

          {result && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="bg-white p-6 md:p-8 rounded-[2rem] shadow-xl border border-slate-100 max-w-3xl mx-auto"
            >
              <div className="flex flex-col md:flex-row gap-8">
                {result.thumbnail && (
                  <div className="w-full md:w-1/3 shrink-0">
                    <div className="aspect-video md:aspect-square bg-slate-100 rounded-2xl overflow-hidden shadow-inner relative">
                      <img 
                        src={result.thumbnail} 
                        alt="Video thumbnail" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                )}
                
                <div className="flex-1 space-y-6">
                  <div>
                    <h3 className="text-xl font-bold text-slate-800 line-clamp-2">
                      {result.title || "Ready to Download"}
                    </h3>
                    <p className="text-slate-500 mt-2 line-clamp-1">{result.author || url}</p>
                  </div>
                  
                  <div className="space-y-3">
                    {result.formats?.map((format: any, index: number) => (
                      <a
                        key={index}
                        href={format.url}
                        target="_blank"
                        rel="noreferrer"
                        download
                        className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all group ${
                          format.isAudio 
                            ? 'border-blue-100 bg-blue-50/50 hover:border-blue-300' 
                            : 'border-[#FFCCE1]/50 bg-[#FFF5D7]/30 hover:border-[#E195AB]/50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${format.isAudio ? 'bg-blue-100 text-blue-600' : 'bg-[#E195AB]/10 text-[#E195AB]'}`}>
                            <Download className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="font-bold text-slate-800">
                              {format.qualityLabel || (format.isAudio ? "High Quality Audio" : "High Quality Video")}
                            </div>
                            <div className="text-sm text-slate-500">
                              {format.extension || (format.isAudio ? 'MP3' : 'MP4')}
                            </div>
                          </div>
                        </div>
                        <span className={`font-bold transition-transform group-hover:-translate-y-0.5 ${format.isAudio ? 'text-blue-600' : 'text-[#E195AB]'}`}>
                          Download
                        </span>
                      </a>
                    ))}

                    {(!result.formats || result.formats.length === 0) && result.downloadUrl && (
                       <a
                          href={result.downloadUrl}
                          target="_blank"
                          rel="noreferrer"
                          download
                          className="flex items-center justify-between p-4 rounded-xl border-2 border-[#FFCCE1]/50 bg-[#FFF5D7]/30 hover:border-[#E195AB]/50 transition-all group"
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-[#E195AB]/10 text-[#E195AB]">
                              <Download className="w-5 h-5" />
                            </div>
                            <div>
                              <div className="font-bold text-slate-800">Direct Download</div>
                              <div className="text-sm text-slate-500">Best Quality</div>
                            </div>
                          </div>
                          <span className="font-bold text-[#E195AB] transition-transform group-hover:-translate-y-0.5">
                            Download
                          </span>
                       </a>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
