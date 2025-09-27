import z from "zod";

export const DownloadRequestSchema = z.object({
  url: z.string().url(),
});

export type DownloadRequest = z.infer<typeof DownloadRequestSchema>;

export interface VideoData {
  success: boolean;
  data?: {
    video_url: string;
    title: string;
    author: string;
    duration: number;
    thumbnail: string;
  };
  error?: string;
}
