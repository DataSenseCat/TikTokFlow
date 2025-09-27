import { Hono } from 'hono';
import { handle } from 'hono/vercel';
import { zValidator } from '@hono/zod-validator';
import { cors } from 'hono/cors';
import { DownloadRequestSchema, VideoData } from '../src/shared/types';

const app = new Hono().basePath('/api');

app.use('*', cors({ origin: '*' }));

app.get('/health', (c) => c.json({ status: 'ok' }));

app.post('/download', zValidator('json', DownloadRequestSchema), async (c) => {
  try {
    const { url } = c.req.valid('json');
    const apiKey = process.env.RAPIDAPI_KEY;

    if (!apiKey) {
      return c.json<VideoData>({ success: false, error: 'La clave de la API no está configurada en el servidor.' }, 500);
    }

    const encodedUrl = encodeURIComponent(url);
    const apiUrl = `https://tiktok-download-without-watermark.p.rapidapi.com/analysis?url=${encodedUrl}`;
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': apiKey,
        'X-RapidAPI-Host': 'tiktok-download-without-watermark.p.rapidapi.com'
      }
    });

    if (!response.ok) {
      let errorMessage = response.statusText;
      try {
        const errorData = await response.json() as any;
        if (errorData && errorData.message) errorMessage = errorData.message;
      } catch (e) { /* Ignore if body is not JSON */ }

      if (response.status === 403) {
        const specificError = errorMessage.includes('not subscribed') 
            ? 'No estás suscrito a esta API. Revisa tu suscripción en RapidAPI.'
            : 'Clave de API inválida o sin permisos. Verifica tu RAPIDAPI_KEY.';
        return c.json<VideoData>({ success: false, error: specificError }, 403);
      }
      if (response.status === 429) {
        return c.json<VideoData>({ success: false, error: 'Límite de solicitudes a la API externa excedido.' }, 429);
      }
      return c.json<VideoData>({ success: false, error: `Error de la API externa: ${errorMessage}` }, response.status as any);
    }

    const data = await response.json() as any;

    if (data && data.code === 0 && data.data) {
      const videoData = data.data;
      
      let authorName = 'Unknown';
      // THIS IS THE FIX: Check for null before checking for object type
      if (videoData.author && typeof videoData.author === 'object') {
        authorName = videoData.author.unique_id || videoData.author.nickname || authorName;
      } else if (videoData.author) {
        authorName = videoData.author;
      }

      return c.json<VideoData>({
        success: true,
        data: {
          video_url: videoData.play || videoData.wmplay || videoData.hdplay || '',
          title: String(videoData.title || videoData.desc || 'TikTok Video'),
          author: String(authorName),
          duration: Number(videoData.duration) || 0,
          thumbnail: videoData.cover || videoData.origin_cover || videoData.dynamic_cover || ''
        }
      });
    } else if (data && (data.video_url || data.play)) {
      return c.json<VideoData>({
        success: true,
        data: {
          video_url: data.video_url || data.play || '',
          title: String(data.title || data.desc || 'TikTok Video'),
          author: String(data.author || data.username || 'Unknown'),
          duration: Number(data.duration) || 0,
          thumbnail: data.thumbnail || data.cover || data.origin_cover || ''
        }
      });
    } else {
      return c.json<VideoData>({ success: false, error: data.msg || 'URL de video inválida o video no encontrado' }, 400);
    }

  } catch (error) {
    console.error('[SERVER ERROR]', error);
    return c.json<VideoData>({ success: false, error: 'Error interno del servidor' }, 500);
  }
});

export const GET = handle(app);
export const POST = handle(app);
