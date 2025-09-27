import { z } from 'zod';

// Schema for validating the incoming request from the frontend
export const DownloadRequestSchema = z.object({
  url: z.string()
    .trim()
    .min(1, { message: 'La URL no puede estar vacía.' })
    .refine(url => url.includes('tiktok.com'), {
      message: 'Por favor, ingresa una URL válida de TikTok.',
    }),
});

// Type for the data structure sent from the backend on success
export type VideoDetails = {
  video_url: string;
  title: string;
  author: string;
  duration: number;
  thumbnail: string;
};

// Type for the overall JSON response from the backend
export type VideoData = 
  | { success: true; data: VideoDetails }
  | { success: false; error: string };
