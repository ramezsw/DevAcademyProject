
 // Calculate Levenshtein distance between two strings (fuzzy measure)

const levenshteinDistance = (a, b) => {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix = Array(a.length + 1).fill().map(() => Array(b.length + 1).fill(0));

  for (let i = 0; i <= a.length; i++) {
    matrix[i][0] = i;
  }
  for (let j = 0; j <= b.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost 
      );
    }
  }

  return matrix[a.length][b.length];
};


const containsAllWords = (a, b) => {
  const aLower = a.toLowerCase();
  const bWords = b.toLowerCase().split(/\s+/).filter(word => word.length > 0);
  
  return bWords.every(word => aLower.includes(word));
};


const calculateSimilarity = (query, text) => {
  if (!query || !text) return 0;
  
  const queryLower = query.toLowerCase().trim();
  const textLower = text.toLowerCase().trim();
  
  if (textLower.includes(queryLower)) {
    return 100;
  }
  
  if (containsAllWords(textLower, queryLower)) {
    return 80;
  }
  
  //calculate word-based similarity
  const queryWords = queryLower.split(/\s+/).filter(word => word.length > 0);
  const textWords = textLower.split(/\s+/).filter(word => word.length > 0);
  
  let matchCount = 0;
  for (const queryWord of queryWords) {
    for (const textWord of textWords) {
      // Exact word match
      if (textWord === queryWord) {
        matchCount += 1;
        continue;
      }
      
      // Partial word match
      if (textWord.includes(queryWord) || queryWord.includes(textWord)) {
        matchCount += 0.5;
      }
    }
  }
  
  const wordScore = queryWords.length > 0 ? (matchCount / queryWords.length) * 60 : 0;
  
  // Calculate character-based similarity using Levenshtein distance
  const maxLen = Math.max(queryLower.length, textLower.length);
  const distance = levenshteinDistance(queryLower, textLower);
  const distanceScore = maxLen > 0 ? ((maxLen - distance) / maxLen) * 40 : 0;
  
  return Math.min(100, wordScore + distanceScore);
};


const searchProducts = (products, options = {}) => {
  const { query, minPrice, maxPrice, category } = options;
  
  const filteredProducts = products.filter(product => {
    if (category && product.category !== category) {
      return false;
    }
    
    const price = parseFloat(product.price);
    if (minPrice !== undefined && price < minPrice) {
      return false;
    }
    if (maxPrice !== undefined && price > maxPrice) {
      return false;
    }
    
    return true;
  });
  
  // If no query, return filtered products
  if (!query) {
    return filteredProducts;
  }
  
  const scoredProducts = filteredProducts.map(product => {
    const nameScore = calculateSimilarity(query, product.name) * 2;
    const descScore = calculateSimilarity(query, product.description);
    const categoryScore = calculateSimilarity(query, product.category);
    
    const totalScore = (nameScore + descScore + categoryScore) / 4; // weighted average
    
    return {
      ...product,
      _score: totalScore
    };
  });
  
  return scoredProducts
    .filter(product => product._score > 0)
    .sort((a, b) => b._score - a._score);
};

const binarySearchProductById = (sortedProducts, productId) => {
  let start = 0;
  let end = sortedProducts.length - 1;
  
  while (start <= end) {
    const mid = Math.floor((start + end) / 2);
    
    if (sortedProducts[mid].id === productId) {
      return sortedProducts[mid];
    }
    
    if (sortedProducts[mid].id < productId) {
      start = mid + 1;
    } else {
      end = mid - 1;
    }
  }
  
  return null;
};

module.exports = {
  searchProducts,
  binarySearchProductById,
  calculateSimilarity,
  levenshteinDistance
};