const allImages = import.meta.glob('../assets/images/**/*', { eager: true });

// Create a map that matches DB

const imageLookup = Object.fromEntries(
  Object.entries(allImages).map(([path, module]) => {
    const cleanKey = path.replace('../', ''); 
    return [cleanKey, module.default];
  })
);

export const getImageUrl = (dbPath) => {
  if (!dbPath) return null;

  // Direct lookup from the mapped object
  const resolvedPath = imageLookup[dbPath];

  if (!resolvedPath) {
    console.warn(`Asset not found for database path: ${dbPath}`);
    return null;
  }

  return resolvedPath;
};