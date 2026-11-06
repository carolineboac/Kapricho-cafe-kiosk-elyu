export interface AddOn {
  id: string;
  name: string;
  price: number;
}

export interface MenuItem {
  id: string;
  category_id: string;
  name: string;
  price: number;
  description: string;
  image: string;
}

export interface Category {
  id: string;
  name: string;
  items: MenuItem[];
}

export interface CartItem extends MenuItem {
  addons: AddOn[];
  quantity: number;
  uniqueId: string;
}

export interface MenuData {
  categories: Category[];
  addons: {
    drinks: AddOn[];
    food?: AddOn[];
  };
}

export interface Ingredient {
  id: string;
  name: string;
  unit: string;
  stock_quantity: number;
  low_stock_threshold: number;
}

export interface RecipeIngredient {
  id?: number;
  menu_item_id: string;
  ingredient_id: string;
  ingredient_name?: string;
  unit?: string;
  amount_used: number;
}