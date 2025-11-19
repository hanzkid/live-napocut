export interface Product {
    id: string;
    name: string;
    price: number;
    image: string;
    images?: string[];
    description?: string;
  }
  
  export interface ChatMessage {
    id: string;
    username: string;
    message: string;
    timestamp: Date;
    isSystem?: boolean;
  }
  