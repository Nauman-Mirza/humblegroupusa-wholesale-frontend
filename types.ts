export interface User {
  _id?: string;
  id?: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  website?: string;
  company_name: string;
  is_active: boolean;
  roles?: string[];
  
  agree_min_order: boolean;
  agree_no_personal_use: boolean;
  agree_terms: boolean;
  agree_no_resell: boolean;
  signed_at: string;
  signature: string;
  
  created_at: string;
  updated_at: string;
}

export interface UserDetail extends User {
  shipping_address: ShippingAddress | null;
  selected_role_id?: string;
}

export interface ShippingAddress {
  address_1: string;
  address_2?: string;
  city: string;
  country: string;
  postcode?: string;
}

export interface UserDetail extends User {
  shipping_address: ShippingAddress | null;
}

export interface Brand {
  _id?: string;
  id?: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface Category {
  _id?: string;
  id?: string;
  name: string;
  description?: string;
  brand_id?: string;
  brand?: Brand;
  created_at: string;
  updated_at: string;
}

export interface SubCategory {
  _id?: string;
  id?: string;
  name: string;
  description?: string;
  brand_id?: string;
  category_id?: string;
  brand?: {
    id: string;
    name: string;
  };
  category?: {
    id: string;
    name: string;
  };
  price_type: 'single' | 'range';
  price: {
    amount?: number;
    min?: number;
    max?: number;
  };
  images: string[];
  created_at: string;
  updated_at: string;
}

export interface AdminUser {
  _id?: string;
  id?: string;
  email: string;
  name: string;
  role: 'super_admin' | 'admin';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CurrentAdmin {
  _id?: string;
  id?: string;
  email: string;
  name: string;
  role: 'super_admin' | 'admin';
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  per_page: number;
  current_page: number;
}

export interface Product {
  _id?: string;
  id?: string;
  name: string;
  description?: string;
  sub_category_id: string;
  brand_id?: string;
  category_id?: string;
  brand?: {
    id: string;
    name: string;
  };
  category?: {
    id: string;
    name: string;
  };
  sub_category?: {
    id: string;
    name: string;
  };
  price: number;
  quantity: number;
  sku: string;
  images: string[];
  warehence_product_id?: string;
  created_at: string;
  updated_at: string;
}

export interface Role {
  _id?: string;
  id?: string;
  name: string;
  description?: string;
  type: 'general' | 'custom';
  created_at: string;
  updated_at: string;
}