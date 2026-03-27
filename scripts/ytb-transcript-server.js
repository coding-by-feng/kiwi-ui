/**
 * Lightweight Node.js server for the /ytb/transcript endpoint.
 * Uses youtube-transcript to fetch subtitles server-side, avoiding CORS issues.
 *
 * Usage:  node scripts/ytb-transcript-server.js
 * Listens on port 3721 by default (override with PORT env var).
 */
const http = require('http');
const url = require('url');

const PORT = process.env.YTB_TRANSCRIPT_PORT || 3721;

const server = http.createServer(async (req, res) => {
  const parsed = url.parse(req.url, true);

  if (parsed.pathname !== '/ytb/transcript') {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
    return;
  }

  const { videoId, lang } = parsed.query;
  if (!videoId) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'videoId is required' }));
    return;
  }

  try {
    const { YoutubeTranscript } = await import('youtube-transcript/dist/youtube-transcript.esm.js');
    const transcript = await YoutubeTranscript.fetchTranscript(videoId, {
      lang: lang || 'en'
    });
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ data: transcript }));
  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: err.message || 'Failed to fetch transcript' }));
  }
});

server.listen(PORT, () => {
  console.log(`ytb-transcript server listening on port ${PORT}`);
});
