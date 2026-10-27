export interface Item {
  menu_item_id: number;
  price: number;
  name: string;
  type: string;
}

export interface CartEntry {
  category: string;
  items: Item[];
  price: number;
}

export interface RatingItem {
  itemName: string;
  rating: number | null;
}
