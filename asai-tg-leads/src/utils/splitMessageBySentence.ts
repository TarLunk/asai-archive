export function splitMessageBySentence(text: string, limit: number): string[] {
  const sentences = text.match(/[^.!?\n]+[.!?\n]*/g) || [text];
  const chunks: string[] = [];

  let currentChunk = "";

  for (const sentence of sentences) {
    if ((currentChunk + sentence).length <= limit) {
      currentChunk += sentence;
    } else {
      if (currentChunk) {
        chunks.push(currentChunk.trim());
      }
      if (sentence.length > limit) {
        // Предложение само по себе слишком длинное — режем жёстко
        let start = 0;
        while (start < sentence.length) {
          chunks.push(sentence.slice(start, start + limit));
          start += limit;
        }
        currentChunk = "";
      } else {
        currentChunk = sentence;
      }
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}
