export interface Product {
  _id: string;
  name: string;
  price: number;
  category: string;
  stock: number | null;
  isAvailable: boolean;
  description?: string;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

