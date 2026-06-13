import { getApiKeyByProvider } from '../storage/keys';

const AGNES_BASE_URL = 'https://apihub.agnes-ai.com';
const AGNES_API_URL = `${AGNES_BASE_URL}/v1`;

interface AgnesImageParams {
  prompt: string;
  image?: string;
  size?: string;
  returnBase64?: boolean;
  negativePrompt?: string;
}

interface AgnesImageResponse {
  data: Array<{
    url?: string;
    b64_json?: string;
  }>;
}

interface AgnesVideoParams {
  prompt: string;
  image?: string;
  images?: string[];
  mode?: string;
  numFrames?: number;
  frameRate?: number;
  width?: number;
  height?: number;
  seed?: number;
  negativePrompt?: string;
}

interface AgnesVideoResponse {
  task_id: string;
  video_id: string;
  status: string;
}

interface AgnesVideoStatusResponse {
  status: string;
  progress: number;
  remixed_from_video_id?: string;
  error?: string;
}

function getApiKey(): string {
  const keyConfig = getApiKeyByProvider('agnes');
  if (!keyConfig) {
    throw new Error('Agnes API Key not configured. Please add it in Settings.');
  }
  return keyConfig.key;
}

function getHeaders(): HeadersInit {
  return {
    'Authorization': `Bearer ${getApiKey()}`,
    'Content-Type': 'application/json',
  };
}

export async function generateImage(params: AgnesImageParams): Promise<AgnesImageResponse> {
  const isImg2Img = !!params.image;

  const body: Record<string, unknown> = {
    model: 'agnes-image-2.1-flash',
    prompt: params.prompt,
    size: params.size || '1024x1024',
  };

  if (params.negativePrompt) {
    body.negative_prompt = params.negativePrompt;
  }

  if (isImg2Img) {
    body.extra_body = {
      image: [params.image],
      response_format: params.returnBase64 ? 'b64_json' : 'url',
    };
  } else {
    if (params.returnBase64) {
      body.return_base64 = true;
    } else {
      body.extra_body = { response_format: 'url' };
    }
  }

  const response = await fetch(`${AGNES_API_URL}/images/generations`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Image generation failed');
  }

  return response.json();
}

export async function generateVideo(params: AgnesVideoParams): Promise<AgnesVideoResponse> {
  const body: Record<string, unknown> = {
    model: 'agnes-video-v2.0',
    prompt: params.prompt,
    num_frames: params.numFrames || 121,
    frame_rate: params.frameRate || 24,
    width: params.width || 1152,
    height: params.height || 768,
  };

  if (params.negativePrompt) {
    body.negative_prompt = params.negativePrompt;
  }

  if (params.seed) {
    body.seed = params.seed;
  }

  if (params.image) {
    body.image = params.image;
  }

  if (params.images && params.images.length > 0) {
    body.extra_body = {
      image: params.images,
      ...(params.mode ? { mode: params.mode } : {}),
    };
  } else if (params.mode) {
    body.extra_body = { mode: params.mode };
  }

  const response = await fetch(`${AGNES_API_URL}/videos`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Video generation failed');
  }

  return response.json();
}

export async function pollVideoStatus(videoId: string): Promise<AgnesVideoStatusResponse> {
  const response = await fetch(`${AGNES_BASE_URL}/agnesapi?video_id=${videoId}`, {
    method: 'GET',
    headers: getHeaders(),
  });

  if (!response.ok) {
    throw new Error('Failed to check video status');
  }

  return response.json();
}

export async function waitForVideoCompletion(
  videoId: string,
  onProgress?: (status: string, progress: number) => void,
  maxWaitTime: number = 600000,
  pollInterval: number = 5000
): Promise<string> {
  const startTime = Date.now();

  while (Date.now() - startTime < maxWaitTime) {
    const response = await pollVideoStatus(videoId);
    const status = response.status;
    const progress = response.progress;

    onProgress?.(status, progress);

    if (['completed', 'success', 'done', 'succeeded'].includes(status)) {
      const videoUrl = response.remixed_from_video_id;
      if (videoUrl) return videoUrl;
      throw new Error('Video completed but no URL found');
    }

    if (['failed', 'error', 'fail'].includes(status)) {
      throw new Error(response.error || 'Video generation failed');
    }

    await new Promise(resolve => setTimeout(resolve, pollInterval));
  }

  throw new Error('Video generation timed out');
}

export async function extractVideoFrame(videoUrl: string): Promise<Blob> {
  const response = await fetch(videoUrl);
  if (!response.ok) {
    throw new Error('Failed to download video');
  }
  return response.blob();
}
