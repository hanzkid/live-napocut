export interface Product {
  id: string;
  name: string;
  price: number;
  formatted_price?: string;
  plain_price?: string;
  image: string;
  images?: string[];
  description?: string;
  link?: string;
  category?: string;
}

export interface ChatMessage {
  id: string;
  username: string;
  message: string;
  timestamp: Date;
  isSystem?: boolean;
}
