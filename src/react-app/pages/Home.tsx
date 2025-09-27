import { useState, useEffect } from 'react';
import DownloadForm from '@/react-app/components/DownloadForm';
import VideoPlayer from '@/react-app/components/VideoPlayer';
import { VideoData } from '@/shared/types';

export default function Home() {
  const [videoData, setVideoData] = useState<VideoData['data'] | null>(null);

  // Add animated background particles
  useEffect(() => {
    const canvas = document.getElementById('bg-canvas') as HTMLCanvasElement;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles: Array<{
      x: number;
      y: number;
      size: number;
      speedX: number;
      speedY: number;
      opacity: number;
    }> = [];

    for (let i = 0; i < 50; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 3 + 1,
        speedX: (Math.random() - 0.5) * 0.5,
        speedY: (Math.random() - 0.5) * 0.5,
        opacity: Math.random() * 0.5 + 0.2,
      });
    }

    function animate() {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((particle) => {
        particle.x += particle.speedX;
        particle.y += particle.speedY;

        if (particle.x < 0 || particle.x > canvas.width) particle.speedX *= -1;
        if (particle.y < 0 || particle.y > canvas.height) particle.speedY *= -1;

        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${particle.opacity})`;
        ctx.fill();
      });

      requestAnimationFrame(animate);
    }

    animate();

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-pink-800 relative overflow-hidden">
      {/* Animated Background */}
      <canvas
        id="bg-canvas"
        className="absolute inset-0 pointer-events-none"
        style={{ zIndex: 1 }}
      />
      
      {/* Background Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/50 to-pink-900/50" style={{ zIndex: 2 }} />
      
      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 py-8 min-h-screen flex flex-col">
        {/* Header */}
        <header className="text-center mb-12">
          <h1 className="text-6xl md:text-7xl font-bold text-white mb-4 bg-gradient-to-r from-pink-400 to-purple-300 bg-clip-text text-transparent animate-pulse">
            TikFlow 🎵
          </h1>
          <p className="text-xl md:text-2xl text-white/80 font-light">
            Descarga videos de TikTok sin marcas de agua
          </p>
          <div className="mt-4 flex justify-center">
            <div className="h-1 w-32 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full" />
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 flex flex-col items-center justify-center space-y-8">
          {!videoData ? (
            <div className="w-full max-w-md">
              <DownloadForm onVideoData={setVideoData} />
            </div>
          ) : (
            <div className="w-full max-w-md space-y-6">
              <VideoPlayer videoData={videoData} />
              <div className="text-center">
                <button
                  onClick={() => setVideoData(null)}
                  className="text-white/80 hover:text-white transition-colors duration-300 underline decoration-pink-500 underline-offset-4"
                >
                  ← Descargar otro video
                </button>
              </div>
            </div>
          )}
        </main>

        {/* Footer */}
        <footer className="text-center text-white/60 text-sm mt-8">
          <p>© 2024 TikFlow - Herramienta gratuita para descargar videos de TikTok</p>
          <p className="mt-1">Respetamos los derechos de autor. Usa responsablemente.</p>
        </footer>
      </div>
    </div>
  );
}
