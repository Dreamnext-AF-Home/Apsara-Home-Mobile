import axios from 'axios';
import { API_CONFIG } from '../config/api';

const api = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface Product {
  id: number;
  soldCount: number;
  avgRating: number;
  supplierId: number;
  supplierName: string | null;
  name: string;
  description: string;
  specifications: string;
  material: string;
  warranty: string;
  catid: number;
  catsubid: number;
  roomType: number;
  brandType: number;
  brand: string;
  priceSrp: number;
  priceDp: number;
  priceMember: number;
  prodpv: number;
  qty: number;
  weight: number;
  psweight: number;
  pswidth: number;
  pslenght: number;
  psheight: number;
  assemblyRequired: boolean;
  type: number;
  musthave: boolean;
  bestseller: boolean;
  salespromo: boolean;
  manualCheckoutEnabled: boolean;
  status: number;
  sku: string;
  uploaderName: string;
  uploaderEmail: string | null;
  uploaderRole: string;
  image: string;
  images: string[];
  variants: Array<{
    id: number;
    sku: string;
    name: string;
    color: string;
    colorHex: string;
    size: string;
    style: string;
    width: number | null;
    dimension: string | null;
    height: number | null;
    priceSrp: number;
    priceDp: number;
    priceMember: number;
    prodpv: number;
    qty: number;
    status: number;
    images: string[];
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface ProductCard {
  id: number;
  name: string;
  image: string;
  soldCount: number;
  originalPrice: number;
  discountedPrice: number;
  pv: number;
  brandName: string;
  variantCount: number;
  badges: {
    musthave: boolean;
    bestseller: boolean;
    salespromo: boolean;
  };
}

export const productService = {
  async getProductCards(token?: string): Promise<ProductCard[]> {
    const headers: Record<string, string> = {};
    if (token) headers.Authorization = `Bearer ${token}`;

    try {
      const response = await api.get('/products/cards', { headers });
      return response.data.products ?? [];
    } catch (error) {
      console.error('Error fetching product cards:', error);
      throw error;
    }
  },

  async getProducts(token?: string): Promise<Product[]> {
    const headers: Record<string, string> = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    
    try {
      const response = await api.get('/products', { headers });
      // Handle different response structures
      let products: Product[] = [];
      
      if (Array.isArray(response.data)) {
        products = response.data;
      } else if (response.data.data && Array.isArray(response.data.data)) {
        products = response.data.data;
      } else if (response.data.products && Array.isArray(response.data.products)) {
        products = response.data.products;
      } else if (response.data.items && Array.isArray(response.data.items)) {
        products = response.data.items;
      } else {
        console.warn('Unexpected API response structure:', response.data);
        products = [];
      }
      
      return products;
    } catch (error) {
      console.error('Error fetching products:', error);
      throw error;
    }
  },

  async getProductById(id: number, token?: string): Promise<Product> {
    const headers: Record<string, string> = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    
    const response = await api.get(`/products/${id}`, { headers });
    return response.data.data || response.data;
  },

  async getProductsByCategory(catid: number, token?: string): Promise<Product[]> {
    const headers: Record<string, string> = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    
    const response = await api.get(`/products/category/${catid}`, { headers });
    return response.data.data || response.data || [];
  },

  async getProductsByBrand(brandType: number, token?: string): Promise<Product[]> {
    const headers: Record<string, string> = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    
    const response = await api.get(`/products/brand/${brandType}`, { headers });
    return response.data.data || response.data || [];
  },

  async getProductsByRoom(roomType: number, token?: string): Promise<Product[]> {
    const headers: Record<string, string> = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    
    const response = await api.get(`/products/room/${roomType}`, { headers });
    return response.data.data || response.data || [];
  },
};

export default productService;
