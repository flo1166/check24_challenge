const images = import.meta.glob('../assets/images/companies/*.svg', { eager: true });

export const getImageUrl = (imagePath) => {
  // 1. **THE FIX:** Check if imagePath is a valid string.
  if (typeof imagePath !== 'string' || !imagePath.length) {
    // Return null or a default placeholder URL if the path is invalid.
    return null; 
  }
  
  // 2. Only run the string methods if imagePath is confirmed to be a string.
  const filename = imagePath.split('/').pop();
  const key = `../assets/images/companies/${filename}`;
  
  return images[key]?.default || null;
};