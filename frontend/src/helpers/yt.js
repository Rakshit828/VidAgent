import { fetchTranscript } from 'youtube-transcript-plus';

const fetchYouTubeTranscript = async (url) => {
  try {
    const videoId = new URL(url).pathname.split('/').pop();
    const transcript = await fetchTranscript(videoId);
    return transcript;
  } catch (error) {
    console.error("Failed to fetch transcript:", error);
    return null;
  }
};

