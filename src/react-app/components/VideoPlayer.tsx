import { Download, User, Clock } from 'lucide-react';
import { VideoData } from '@/shared/types';

interface VideoPlayerProps {
  videoData: VideoData['data'];
}

export default function VideoPlayer({ videoData }: VideoPlayerProps) {
  if (!videoData) return null;
  
  // Ensure all data is properly typed and safe to render
  const safeVideoData = {
    video_url: String(videoData.video_url || ''),
    title: String(videoData.title || 'TikTok Video'),
    author: String(videoData.author || 'Unknown'),
    duration: Number(videoData.duration) || 0,
    thumbnail: String(videoData.thumbnail || '')
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = safeVideoData.video_url;
    link.download = `${safeVideoData.title.replace(/[^a-z0-9]/gi, '_')}.mp4`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-full max-w-md mx-auto bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 shadow-2xl">
      {/* Video Info */}
      <div className="mb-4 space-y-2">
        <h3 className="text-lg font-semibold text-white truncate">{safeVideoData.title}</h3>
        <div className="flex items-center gap-4 text-sm text-white/80">
          <div className="flex items-center gap-1">
            <User className="w-4 h-4" />
            <span>{safeVideoData.author}</span>
          </div>
          {safeVideoData.duration > 0 && (
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>{Math.round(safeVideoData.duration)}s</span>
            </div>
          )}
        </div>
      </div>

      {/* Video Player */}
      <div className="mb-4 rounded-xl overflow-hidden bg-black/20">
        <video
          controls
          className="w-full h-auto max-h-96 object-contain"
          poster={safeVideoData.thumbnail}
          preload="metadata"
        >
          <source src={safeVideoData.video_url} type="video/mp4" />
          Tu navegador no soporta la reproducción de video.
        </video>
      </div>

      {/* Download Button */}
      <button
        onClick={handleDownload}
        className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-lg flex items-center justify-center gap-2 group"
      >
        <Download className="w-5 h-5 group-hover:animate-bounce" />
        Descargar Video
      </button>
      
      <p className="text-xs text-white/60 text-center mt-2">
        Haz clic para descargar el video sin marca de agua
      </p>
    </div>
  );
}
