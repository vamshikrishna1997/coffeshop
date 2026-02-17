
export interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: 'Coffee' | 'Tea' | 'Pastry' | 'Seasonal';
  description: string;
  image: string;
}

export interface CartItem extends MenuItem {
  quantity: number;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  isThinking?: boolean;
}

export interface Location {
  name: string;
  address: string;
  distance?: string;
  coords: { lat: number; lng: number };
}
