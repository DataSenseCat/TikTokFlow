import { Hono } from 'hono';
import { handle } from 'hono/vercel';
import { zValidator } from '@hono/zod-validator';
import { cors } from 'hono/cors';
// The import MUST include the .js extension for Node.js ESM to work correctly.
import { DownloadRequestSchema, VideoData } from './types.js';

const app = new Hono().basePath('/api');

app.use('*', cors({ origin: '*' }));

app.post('/download', zValidator('json', DownloadRequestSchema), async (c) => {
  try {
    const { url } = c.req.valid('json');
    const apiKey = process.env.RAPIDAPI_KEY;

    if (!apiKey) {
      console.error('FATAL: RAPIDAPI_KEY environment variable is not set.');
      return c.json<VideoData>({ success: false, error: 'Error del Servidor: La clave de API no está configurada.' }, 500);
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

    const responseText = await response.text();
    let data: any;

    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.error('External API did not return valid JSON:', responseText);
      return c.json<VideoData>({ success: false, error: `La API externa devolvió una respuesta inválida (código: ${response.status})` }, 502);
    }

    if (!response.ok) {
      const errorMsg = data?.message || data?.msg || 'Error desconocido de la API externa.';
      return c.json<VideoData>({ success: false, error: `Error de la API externa: ${errorMsg}` }, response.status as any);
    }

    if (data.code !== 0 || !data.data) {
      return c.json<VideoData>({ success: false, error: data.msg || 'La API externa no pudo procesar la URL.' }, 400);
    }

    const videoData = data.data;
    const videoUrl = videoData.play || videoData.wmplay || videoData.hdplay;

    if (typeof videoUrl !== 'string' || !videoUrl) {
      return c.json<VideoData>({ success: false, error: 'El video fue procesado, pero la API no devolvió una URL de descarga.' }, 404);
    }

    const author = videoData.author;
    const authorName = typeof author === 'object' ? (author.unique_id || author.nickname) : (typeof author === 'string' ? author : 'Autor Desconocido');
    const title = videoData.title || videoData.desc || 'Video de TikTok';
    const thumbnail = videoData.cover || videoData.origin_cover || videoData.dynamic_cover;

    return c.json<VideoData>({
      success: true,
      data: {
        video_url: videoUrl,
        title: String(title),
        author: String(authorName),
        duration: Number(videoData.duration) || 0,
        thumbnail: String(thumbnail || ''),
      }
    });

  } catch (error: any) {
    if (error.name === 'ZodError') {
      return c.json<VideoData>({ success: false, error: `Petición inválida: ${error.errors[0]?.message}` }, 400);
    }
    console.error('[FATAL_SERVER_ERROR]', error);
    return c.json<VideoData>({ success: false, error: 'Ha ocurrido un error fatal e inesperado en el servidor.' }, 500);
  }
});

app.get('/health', (c) => c.json({ status: 'ok' }));

export const GET = handle(app);
export const POST = handle(app);
