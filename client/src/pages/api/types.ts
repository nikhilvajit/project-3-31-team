// In your types.ts
export interface MenuItemResponse {
    menu_item_id: number;
    name: string;
    price: number;
    amount_available: number;
    type: string;
    is_favorite: boolean;
    image_url?: string;  // Add this for direct uploads
  }
  
  export interface MenuItem extends MenuItemResponse {
    category?: string;
    image?: string;
    image_url?: string;  // Add this here too
    calories?: string;
    prices?: { size: string; price: string; }[];
    isFavorite?: boolean;
  }
  
  export interface DrinkItem extends MenuItemResponse {
    size?: string;
  }