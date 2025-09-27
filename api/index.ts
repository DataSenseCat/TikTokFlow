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
      console.error('CRITICAL: RAPIDAPI_KEY is not set in Vercel environment variables.');
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

    let data;
    try {
      data = await response.json() as any;
    } catch (jsonError) {
      console.error('[JSON PARSE ERROR]', 'The external API returned a non-JSON response, even with a 200 OK status.');
      return c.json<VideoData>({ success: false, error: 'La API externa devolvió una respuesta con formato incorrecto.' }, 502); // 502 Bad Gateway
    }

    if (!response.ok) {
      const errorMessage = data?.message || response.statusText || 'Error desconocido de la API externa.';
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

    if (data && data.code === 0 && data.data) {
      const videoData = data.data;
      
      let authorName = 'Unknown';
      if (videoData.author && typeof videoData.author === 'object') {
        authorName = videoData.author.unique_id || videoData.author.nickname || authorName;
      } else if (typeof videoData.author === 'string' && videoData.author) {
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
    } else {
      return c.json<VideoData>({ success: false, error: data.msg || 'URL de video inválida o video no encontrado' }, 400);
    }

  } catch (error) {
    console.error('[SERVER CRASH]', error);
    return c.json<VideoData>({ success: false, error: 'Error interno del servidor. Revisa los logs de Vercel.' }, 500);
  }
});

export const GET = handle(app);
export const POST = handle(app);
