/**
 * YouTube Subtitles Utility
 *
 * Provides video ID extraction from various YouTube URL formats.
 * Subtitle fetching is handled by the backend API.
 */

/**
 * Extract YouTube video ID from various URL formats or return the ID if already valid
 * @param {string} input - YouTube URL or video ID
 * @returns {string|null} - Video ID or null if invalid
 */
export function extractVideoId(input) {
  if (!input || typeof input !== 'string') {
    return null;
  }

  const trimmed = input.trim();

  // Check if it's already a valid video ID (11 characters, alphanumeric with - and _)
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  // Try to extract from various YouTube URL formats
  const patterns = [
    // Standard watch URLs: youtube.com/watch?v=VIDEO_ID
    /(?:youtube\.com\/watch\?.*v=)([a-zA-Z0-9_-]{11})/,
    // Short URLs: youtu.be/VIDEO_ID
    /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    // Embed URLs: youtube.com/embed/VIDEO_ID
    /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    // YouTube Shorts: youtube.com/shorts/VIDEO_ID
    /(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
    // YouTube Music: music.youtube.com/watch?v=VIDEO_ID
    /(?:music\.youtube\.com\/watch\?.*v=)([a-zA-Z0-9_-]{11})/,
    // YouTube with timestamp: youtube.com/watch?v=VIDEO_ID&t=123
    /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})(?:&|$)/,
    // Nocookie embed: youtube-nocookie.com/embed/VIDEO_ID
    /(?:youtube-nocookie\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
  ];

  for (const pattern of patterns) {
    const match = trimmed.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

export default {
  extractVideoId
};
