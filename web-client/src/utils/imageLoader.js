// Import both company logos and car images
const companyImages = import.meta.glob('../assets/images/companies/*.svg', { eager: true });
const carImages = import.meta.glob('../assets/images/cars/*.*', { eager: true });

export const getImageUrl = (imagePath) => {
  // 1. Check if imagePath is a valid string
  if (typeof imagePath !== 'string' || !imagePath.length) {
    return null; 
  }
  
  // 2. Extract filename from path
  const filename = imagePath.split('/').pop();
  
  // 3. Try company images first
  const companyKey = `../assets/images/companies/${filename}`;
  if (companyImages[companyKey]) {
    return companyImages[companyKey].default;
  }
  
  // 4. Try car images
  const carKey = `../assets/images/cars/${filename}`;
  if (carImages[carKey]) {
    return carImages[carKey].default;
  }
  
  // 5. Return null if not found
  console.warn(`Image not found: ${imagePath}`);
  return null;
};