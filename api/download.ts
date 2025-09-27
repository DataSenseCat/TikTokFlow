import type { VercelRequest, VercelResponse } from '@vercel/node';
import z from 'zod';
import { DownloadRequestSchema, VideoData } from '../src/shared/types';

const parseBody = (req: VercelRequest) => {
  if (typeof req.body === 'object' && req.body) return req.body;
  try {
    return JSON.parse(req.body as any);
  } catch {
    return {};
  }
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ success: false, error: 'Method Not Allowed' } satisfies VideoData);
  }

  try {
    const body = parseBody(req);
    const parsed = DownloadRequestSchema.safeParse(body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: 'Solicitud inválida: URL requerida' } satisfies VideoData);
    }

    const { url } = parsed.data;

    const apiKey = process.env.RAPIDAPI_KEY;
    if (!apiKey) {
      return res.status(500).json({
        success: false,
        error: 'RapidAPI key not configured. Please add your RAPIDAPI_KEY in the environment variables.'
      } satisfies VideoData);
    }

    const encodedUrl = encodeURIComponent(url);
    const apiUrl = `https://tiktok-download-without-watermark.p.rapidapi.com/analysis?url=${encodedUrl}`;

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': apiKey,
        'X-RapidAPI-Host': 'tiktok-download-without-watermark.p.rapidapi.com',
      },
    });

    const data: any = await response.json().catch(() => ({}));

    if (!response.ok) {
      if (response.status === 403) {
        if (data.message && typeof data.message === 'string' && data.message.includes('not subscribed')) {
          return res.status(403).json({
            success: false,
            error: 'No estás suscrito a esta API. Ve a RapidAPI y suscríbete a "TikTok Download Without Watermark" de yi005 para usar esta función.'
          } satisfies VideoData);
        }
        return res.status(403).json({ success: false, error: 'Clave de API inválida. Verifica tu RAPIDAPI_KEY en RapidAPI.com' } satisfies VideoData);
      }
      if (response.status === 429) {
        return res.status(429).json({ success: false, error: 'Límite de solicitudes excedido. Intenta de nuevo en unos minutos.' } satisfies VideoData);
      }
      return res.status(response.status).json({ success: false, error: `Error de la API: ${data.message || response.statusText}` } satisfies VideoData);
    }

    if (data && data.code === 0 && data.data) {
      const videoData = data.data;
      return res.status(200).json({
        success: true,
        data: {
          video_url: videoData.play || videoData.wmplay || videoData.hdplay || '',
          title: String(videoData.title || videoData.desc || 'TikTok Video'),
          author: String(videoData.author?.unique_id || videoData.author?.nickname || videoData.username || 'Unknown'),
          duration: Number(videoData.duration) || 0,
          thumbnail: videoData.cover || videoData.origin_cover || videoData.dynamic_cover || '',
        },
      } satisfies VideoData);
    }

    if (data && (data.video_url || data.play)) {
      return res.status(200).json({
        success: true,
        data: {
          video_url: data.video_url || data.play || '',
          title: String(data.title || data.desc || 'TikTok Video'),
          author: String(data.author || data.username || 'Unknown'),
          duration: Number(data.duration) || 0,
          thumbnail: data.thumbnail || data.cover || data.origin_cover || '',
        },
      } satisfies VideoData);
    }

    return res.status(400).json({ success: false, error: data?.msg || 'URL de video inválida o video no encontrado' } satisfies VideoData);
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Internal server error' } satisfies VideoData);
  }
}
