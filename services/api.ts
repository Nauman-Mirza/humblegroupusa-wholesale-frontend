const API_BASE = 'http://66.94.118.116/api/admin';

const getToken = () => localStorage.getItem('token');

const handleResponse = async (response: Response) => {
  const contentType = response.headers.get('content-type');
  
  if (!response.ok) {
    let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
    
    if (contentType && contentType.includes('application/json')) {
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
      } catch (e) {
        // If JSON parsing fails, use default message
      }
    }
    
    throw new Error(errorMessage);
  }
  
  if (contentType && contentType.includes('application/json')) {
    return await response.json();
  }
  
  throw new Error('Invalid response format');
};

export const api = {
  auth: {
    login: async (email: string, password: string) => {
      const response = await fetch(`${API_BASE}/login`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });
      return handleResponse(response);
    },
    
    getCurrentAdmin: async () => {
      const response = await fetch(`${API_BASE}/userData`, {
        headers: { 
          'Token': getToken() || '',
          'Accept': 'application/json'
        }
      });
      return handleResponse(response);
    }
  },

  admins: {
    getAll: async (params: { per_page: number; page: number; is_active?: boolean; search?: string; role?: string }) => {
      const query = new URLSearchParams();
      query.append('per_page', params.per_page.toString());
      query.append('page', params.page.toString());
      if (params.is_active !== undefined) query.append('is_active', params.is_active.toString());
      if (params.search) query.append('search', params.search);
      if (params.role) query.append('role', params.role);

      const response = await fetch(`${API_BASE}/viewAll?${query}`, {
        headers: { 
          'Token': getToken() || '',
          'Accept': 'application/json'
        }
      });
      
      const result = await handleResponse(response);
      const responseData = result.data[0];
      
      return {
        data: responseData.items || [],
        total: responseData.pagination?.total || 0,
        per_page: responseData.pagination?.per_page || 10,
        current_page: responseData.pagination?.current_page || 1
      };
    },

    create: async (data: { name: string; email: string; password: string; role: string; is_active?: boolean }) => {
      const response = await fetch(`${API_BASE}/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Token': getToken() || ''
        },
        body: JSON.stringify(data)
      });
      return handleResponse(response);
    },

    update: async (adminId: string, data: { name?: string; email?: string; password?: string; role?: string; is_active?: boolean }) => {
      const response = await fetch(`${API_BASE}/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Token': getToken() || ''
        },
        body: JSON.stringify({ admin_id: adminId, ...data })
      });
      return handleResponse(response);
    },

    delete: async (adminId: string) => {
      const response = await fetch(`${API_BASE}/delete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Token': getToken() || ''
        },
        body: JSON.stringify({ admin_id: adminId })
      });
      return handleResponse(response);
    }
  },

  users: {
    getAll: async (params: { per_page: number; page: number; is_active?: boolean }) => {
      const query = new URLSearchParams();
      query.append('per_page', params.per_page.toString());
      query.append('page', params.page.toString());
      if (params.is_active !== undefined) {
        query.append('is_active', params.is_active.toString());
      }

      const response = await fetch(`${API_BASE}/users?${query}`, {
        headers: { 
          'Token': getToken() || '',
          'Accept': 'application/json'
        }
      });
      
      const result = await handleResponse(response);
      const responseData = result.data[0];
      
      return {
        data: responseData.items || [],
        total: responseData.pagination?.total || 0,
        per_page: responseData.pagination?.per_page || 10,
        current_page: responseData.pagination?.current_page || 1
      };
    },

    getDetail: async (userId: string) => {
      const response = await fetch(`${API_BASE}/user?user_id=${userId}`, {
        headers: { 
          'Token': getToken() || '',
          'Accept': 'application/json'
        }
      });
      return handleResponse(response);
    },

    update: async (userId: string, data: any) => {
      const response = await fetch(`${API_BASE}/users/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Token': getToken() || ''
        },
        body: JSON.stringify({ user_id: userId, ...data })
      });
      return handleResponse(response);
    },

    setActive: async (userId: string, isActive: boolean) => {
      const response = await fetch(`${API_BASE}/users/active`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Token': getToken() || ''
        },
        body: JSON.stringify({ user_id: userId, is_active: isActive })
      });
      return handleResponse(response);
    },

    delete: async (userId: string) => {
      const response = await fetch(`${API_BASE}/users/delete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Token': getToken() || ''
        },
        body: JSON.stringify({ user_id: userId })
      });
      return handleResponse(response);
    }
  },

  brands: {
    getAll: async (params: { per_page: number; page: number; search?: string }) => {
      const query = new URLSearchParams();
      query.append('per_page', params.per_page.toString());
      query.append('page', params.page.toString());
      if (params.search) query.append('search', params.search);

      const response = await fetch(`${API_BASE}/brands?${query}`, {
        headers: { 
          'Token': getToken() || '',
          'Accept': 'application/json'
        }
      });
      
      const result = await handleResponse(response);
      const responseData = result.data[0];
      
      return {
        data: responseData.items || [],
        total: responseData.pagination?.total || 0,
        per_page: responseData.pagination?.per_page || 10,
        current_page: responseData.pagination?.current_page || 1
      };
    },

    create: async (name: string, description: string) => {
      const response = await fetch(`${API_BASE}/brand/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Token': getToken() || ''
        },
        body: JSON.stringify({ name, description })
      });
      return handleResponse(response);
    },

    update: async (brandId: string, name: string, description: string) => {
      const response = await fetch(`${API_BASE}/brand/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Token': getToken() || ''
        },
        body: JSON.stringify({ brand_id: brandId, name, description })
      });
      return handleResponse(response);
    },

    delete: async (brandId: string) => {
      const response = await fetch(`${API_BASE}/brand/delete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Token': getToken() || ''
        },
        body: JSON.stringify({ brand_id: brandId })
      });
      return handleResponse(response);
    }
  },

  categories: {
    getAll: async (params: { per_page: number; page: number; brand_id?: string; search?: string }) => {
      const query = new URLSearchParams();
      query.append('per_page', params.per_page.toString());
      query.append('page', params.page.toString());
      if (params.brand_id) query.append('brand_id', params.brand_id);
      if (params.search) query.append('search', params.search);

      const response = await fetch(`${API_BASE}/categories?${query}`, {
        headers: { 
          'Token': getToken() || '',
          'Accept': 'application/json'
        }
      });
      
      const result = await handleResponse(response);
      const responseData = result.data[0];
      
      return {
        data: responseData.items || [],
        total: responseData.pagination?.total || 0,
        per_page: responseData.pagination?.per_page || 10,
        current_page: responseData.pagination?.current_page || 1
      };
    },

    create: async (name: string, description: string, brandId: string) => {
      const response = await fetch(`${API_BASE}/category/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Token': getToken() || ''
        },
        body: JSON.stringify({ name, description, brand_id: brandId })
      });
      return handleResponse(response);
    },

    update: async (categoryId: string, name: string, description: string, brandId: string) => {
      const response = await fetch(`${API_BASE}/category/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Token': getToken() || ''
        },
        body: JSON.stringify({ category_id: categoryId, name, description, brand_id: brandId })
      });
      return handleResponse(response);
    },

    delete: async (categoryId: string) => {
      const response = await fetch(`${API_BASE}/category/delete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Token': getToken() || ''
        },
        body: JSON.stringify({ category_id: categoryId })
      });
      return handleResponse(response);
    }
  },

  subCategories: {
    getAll: async (params: { per_page: number; page: number; brand_id?: string; category_id?: string; search?: string }) => {
      const query = new URLSearchParams();
      query.append('per_page', params.per_page.toString());
      query.append('page', params.page.toString());
      if (params.brand_id) query.append('brand_id', params.brand_id);
      if (params.category_id) query.append('category_id', params.category_id);
      if (params.search) query.append('search', params.search);

      const response = await fetch(`${API_BASE}/sub-categories?${query}`, {
        headers: { 
          'Token': getToken() || '',
          'Accept': 'application/json'
        }
      });
      
      const result = await handleResponse(response);
      const responseData = result.data[0];
      
      return {
        data: responseData.items || [],
        total: responseData.pagination?.total || 0,
        per_page: responseData.pagination?.per_page || 10,
        current_page: responseData.pagination?.current_page || 1
      };
    },

    create: async (formData: FormData) => {
      const response = await fetch(`${API_BASE}/sub-category/create`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Token': getToken() || ''
        },
        body: formData
      });
      return handleResponse(response);
    },

    update: async (formData: FormData) => {
      const response = await fetch(`${API_BASE}/sub-category/update`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Token': getToken() || ''
        },
        body: formData
      });
      return handleResponse(response);
    },

    delete: async (subCategoryId: string) => {
      const response = await fetch(`${API_BASE}/sub-category/delete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Token': getToken() || ''
        },
        body: JSON.stringify({ sub_category_id: subCategoryId })
      });
      return handleResponse(response);
    }
  }
};