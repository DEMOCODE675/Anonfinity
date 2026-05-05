const badWords = ['badword1', 'badword2', 'badword3'];

export const filterBadWords = (text) => {
  let filteredText = text;
  badWords.forEach((word) => {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    filteredText = filteredText.replace(regex, '****');
  });
  return filteredText;
};