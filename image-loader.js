module.exports = function imageLoader({ src, width, quality }) {
  // Extract the path without query parameters for local files
  const [path, query] = src.split('?');
  const params = new URLSearchParams(query || '');
  
  // If it's a local file, return it as is with the query parameters
  if (path.startsWith('/')) {
    // If width is provided, add it to the query parameters
    if (width) {
      params.set('width', width);
    }
    if (quality) {
      params.set('quality', quality);
    }
    
    const queryString = params.toString();
    return queryString ? `${path}?${queryString}` : path;
  }
  
  // For remote images, use the default loader
  return `/_next/image?url=${encodeURIComponent(src)}&w=${width}&q=${quality || 75}`;
};
