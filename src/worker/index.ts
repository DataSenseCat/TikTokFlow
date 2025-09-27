import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { cors } from "hono/cors";
import { DownloadRequestSchema, VideoData } from "../shared/types";

const app = new Hono<{ Bindings: Env }>();

// Enable CORS for frontend requests
app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

app.post('/api/download', zValidator('json', DownloadRequestSchema), async (c) => {
  try {
    const { url } = c.req.valid('json');
    
    if (!c.env.RAPIDAPI_KEY) {
      return c.json<VideoData>({ 
        success: false, 
        error: 'RapidAPI key not configured. Please add your RAPIDAPI_KEY in the environment variables.' 
      }, 500);
    }

    // Make request to TikTok API via RapidAPI - "TikTok Download Without Watermark" by yi005
    const encodedUrl = encodeURIComponent(url);
    const apiUrl = `https://tiktok-download-without-watermark.p.rapidapi.com/analysis?url=${encodedUrl}`;
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': c.env.RAPIDAPI_KEY,
        'X-RapidAPI-Host': 'tiktok-download-without-watermark.p.rapidapi.com'
      }
    });

    const data = await response.json() as any;

    if (!response.ok) {
      // Handle specific RapidAPI errors
      if (response.status === 403) {
        if (data.message && data.message.includes('not subscribed')) {
          return c.json<VideoData>({ 
            success: false, 
            error: 'No estás suscrito a esta API. Ve a RapidAPI y suscríbete a "TikTok Download Without Watermark" de yi005 para usar esta función.' 
          }, 403);
        } else {
          return c.json<VideoData>({ 
            success: false, 
            error: 'Clave de API inválida. Verifica tu RAPIDAPI_KEY en RapidAPI.com' 
          }, 403);
        }
      } else if (response.status === 429) {
        return c.json<VideoData>({ 
          success: false, 
          error: 'Límite de solicitudes excedido. Intenta de nuevo en unos minutos.' 
        }, 429);
      } else {
        return c.json<VideoData>({ 
          success: false, 
          error: `Error de la API: ${data.message || response.statusText}` 
        }, response.status);
      }
    }
    
    
    
    // Transform the response to our expected format
    // yi005's API returns different response structure
    if (data && data.code === 0 && data.data) {
      // yi005 API structure: { code: 0, msg: "success", data: { ... } }
      const videoData = data.data;
      return c.json<VideoData>({
        success: true,
        data: {
          video_url: videoData.play || videoData.wmplay || videoData.hdplay || '',
          title: String(videoData.title || videoData.desc || 'TikTok Video'),
          author: String(videoData.author?.unique_id || videoData.author?.nickname || videoData.username || 'Unknown'),
          duration: Number(videoData.duration) || 0,
          thumbnail: videoData.cover || videoData.origin_cover || videoData.dynamic_cover || ''
        }
      });
    } else if (data && (data.video_url || data.play)) {
      // Direct structure fallback
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
      return c.json<VideoData>({ 
        success: false, 
        error: data.msg || 'URL de video inválida o video no encontrado' 
      }, 400);
    }

  } catch (error) {
    return c.json<VideoData>({ 
      success: false, 
      error: 'Internal server error' 
    }, 500);
  }
});

// Health check endpoint
app.get('/api/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default app;
