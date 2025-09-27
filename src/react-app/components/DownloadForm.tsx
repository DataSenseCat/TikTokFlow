import { useState } from 'react';
import { Download, Loader2, AlertCircle } from 'lucide-react';
import { VideoData, VideoDetails } from '@/shared/types';

interface DownloadFormProps {
  onVideoData: (data: VideoDetails) => void;
}

const getErrorMessage = (error: any): string => {
  if (!error) return 'Error desconocido';
  if (typeof error === 'string') return error;
  if (typeof error.message === 'string') return error.message;
  return 'Ocurrió un error inesperado';
};

export default function DownloadForm({ onVideoData }: DownloadFormProps) {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!url.trim() || !url.includes('tiktok.com')) {
      setError('Por favor, ingresa una URL válida de TikTok.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/download', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ url: url.trim() }),
        cache: 'no-store'
      });

      const raw = await response.text();
      let data: VideoData;

      try {
        data = JSON.parse(raw) as VideoData;
      } catch {
        data = { success: false, error: raw || `El servidor devolvió una respuesta inválida (código: ${response.status})` };
      }

      if (!response.ok) {
        const errorMessage = data && !data.success ? data.error : `Error del servidor (${response.status})`;
        setError(getErrorMessage(errorMessage));
        return;
      }

      if (data.success) {
        onVideoData(data.data);
        setUrl('');
      } else {
        setError(getErrorMessage(data.error || 'Error al procesar el video'));
      }
    } catch (err) {
      setError('Error de conexión. Por favor, intenta de nuevo.');
      console.error('Download error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Pega aquí el enlace de TikTok..."
            className="w-full px-4 py-3 bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all duration-300"
            disabled={loading}
          />
        </div>
        
        {error && (
          <div className="flex items-center gap-2 text-red-300 text-sm bg-red-500/10 backdrop-blur-lg border border-red-500/20 rounded-xl p-3">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !url.trim()}
          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-lg disabled:scale-100 disabled:shadow-none flex items-center justify-center gap-2 group"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Procesando...
            </>
          ) : (
            <>
              <Download className="w-5 h-5 group-hover:animate-bounce" />
              Descargar
            </>
          )}
        </button>
      </form>

      <div className="mt-6 text-center text-white/60 text-sm">
        <p>✨ Descarga videos de TikTok sin marcas de agua</p>
        <p className="mt-1">🎵 Gratis y sin límites</p>
      </div>
    </div>
  );
}
