let lastPostTime = 0;
const RATE_LIMIT = 20000; // 20 seconds

export const canPost = () => {
  const now = Date.now();
  if (now - lastPostTime > RATE_LIMIT) {
    lastPostTime = now;
    return true;
  }
  return false;
};