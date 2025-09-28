import { z } from 'zod';

export const DownloadRequestSchema = z.object({
  url: z.string().trim().min(1, { message: 'La URL no puede estar vacía.' })
});

export type VideoDetails = {
  video_url: string;
  title: string;
  author: string;
  duration: number;
  thumbnail: string;
};

export type VideoData = 
  | { success: true; data: VideoDetails }
  | { success: false; error: string };
