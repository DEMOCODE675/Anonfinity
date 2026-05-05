// Utility to parse hashtags and mentions
export const parseHashtags = (text) => {
  const hashtagRegex = /#[\w]+/g;
  return text.match(hashtagRegex) || [];
};

export const parseMentions = (text) => {
  const mentionRegex = /@[\w]+/g;
  return text.match(mentionRegex) || [];
};

// Format text with highlighting for hashtags and mentions
export const formatPostContent = (text) => {
  // Replace hashtags with links
  let formatted = text.replace(/#[\w]+/g, (match) => {
    return `<span class="text-blue-600 font-semibold">${match}</span>`;
  });

  // Replace mentions with highlighting
  formatted = formatted.replace(/@[\w]+/g, (match) => {
    return `<span class="text-purple-600 font-semibold">${match}</span>`;
  });

  // Replace line breaks with <br>
  formatted = formatted.replace(/\n/g, '<br>');

  return formatted;
};

// Extract hashtags for trending
export const getHashtagsForTrending = (posts) => {
  const hashtagCount = {};
  
  posts.forEach(post => {
    const hashtags = parseHashtags(post.content);
    hashtags.forEach(tag => {
      hashtagCount[tag] = (hashtagCount[tag] || 0) + 1;
    });
  });

  return Object.entries(hashtagCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);
};
