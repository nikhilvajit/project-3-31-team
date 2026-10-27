import { MenuItemResponse } from './types';

const CLOUDINARY_URL = `https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/q_auto,f_auto/`;

export const getImagePath = (item: MenuItemResponse) => {
  // If the item has a direct image_url (from website upload), use that
  if (item.image_url) {
    const type = item.type.toLowerCase();
    const formattedName = item.name.replace(/\s+/g, '_');
    const publicId = `panda express images/${type}${formattedName}`;
    console.log('Generated regular URL:', `${CLOUDINARY_URL}${publicId}`);
    return `${CLOUDINARY_URL}${publicId}`;
  }
  
  const type = item.type.toLowerCase();
  const formattedName = item.name.replace(/\s+/g, '_');

  // For test items
  if (item.name.toLowerCase().includes('test')) {
    // For test items, get the exact public ID from Cloudinary Media Explorer
    const publicId = item.type.toLowerCase() + 'test_item_with_no_space';
    console.log('Generated test item URL:', `${CLOUDINARY_URL}${publicId}`);
    return `${CLOUDINARY_URL}${publicId}`;
  }

  // For all other manually uploaded items
  switch(type) {
    case 'appetizer':
      return `${CLOUDINARY_URL}panda express images/appetizer${formattedName}`;
    case 'dessert':
      return `${CLOUDINARY_URL}panda express images/dessert${formattedName}`;
    case 'drink':
      return `${CLOUDINARY_URL}panda express images/sideChow_Mein`;
    case 'premium entree':
      return `${CLOUDINARY_URL}panda express images/premium_entree${formattedName}`;
    case 'entree':
      return `${CLOUDINARY_URL}panda express images/entree${formattedName}`;
    case 'side':
      return `${CLOUDINARY_URL}panda express images/side${formattedName}`;
    default:
      return `${CLOUDINARY_URL}panda express images/${type}${formattedName}`;
  }
};
