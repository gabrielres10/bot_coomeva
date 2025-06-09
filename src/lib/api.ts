import { MenuParams, MenuItem, ValidValues } from '@/types/chat';

// Usar la URL del servidor de desarrollo por defecto
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Función auxiliar para manejar errores de conexión
const handleApiError = (error: unknown) => {
  console.error('API Error:', error);
  if (error instanceof Error) {
    if (error.message.includes('Failed to fetch')) {
      throw new Error('Sin conexión al servidor. Por favor, asegúrate de que el servidor esté corriendo.');
    }
  }
  throw error;
};

export const getValidValues = async (): Promise<ValidValues> => {
  try {
    console.log('Fetching valid values from:', `${API_URL}/api/valid-values`);
    const response = await fetch(`${API_URL}/api/valid-values`);
    if (!response.ok) {
      throw new Error('Error al obtener valores válidos');
    }
    const data = await response.json();
    console.log('Valid values response:', data);
    return data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};

export const getMenuItems = async (): Promise<MenuItem[]> => {
  try {
    console.log('Fetching menu items from:', `${API_URL}/api/menu-recommendations`);
    const response = await fetch(`${API_URL}/api/menu-recommendations`);
    if (!response.ok) {
      console.error('Error response:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('Error details:', errorText);
      throw new Error('Error al obtener menús');
    }
    const data = await response.json();
    console.log('Menu items response:', data);
    return data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};

export const getMenuRecommendations = async (params: MenuParams): Promise<MenuItem[]> => {
  try {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        queryParams.append(key, value.toString());
      }
    });

    const response = await fetch(`${API_URL}/api/menu-recommendations?${queryParams}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch menu recommendations');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching menu recommendations:', error);
    throw error;
  }
}; 