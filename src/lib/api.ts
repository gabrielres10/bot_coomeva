import { MenuParams, MenuItem, ValidValues } from '@/types/chat';
import { supabase } from './supabase';

export const getValidValues = async (): Promise<ValidValues> => {
  try {
    // Obtener tipos de menú
    const { data: tiposData, error: tiposError } = await supabase
      .from('menu_proveedor')
      .select('tipo');

    if (tiposError) throw tiposError;

    // Obtener sedes
    const { data: sedesData, error: sedesError } = await supabase
      .from('sede')
      .select('id, nombre');

    if (sedesError) throw sedesError;

    // Obtener ciudades
    const { data: ciudadesData, error: ciudadesError } = await supabase
      .from('ciudad')
      .select('id, nombre');

    if (ciudadesError) throw ciudadesError;

    // Obtener proveedores
    const { data: proveedoresData, error: proveedoresError } = await supabase
      .from('proveedor')
      .select('id, nombre');

    if (proveedoresError) throw proveedoresError;

    // Filtrar tipos únicos
    const tiposUnicos = [...new Set(tiposData.map((row: { tipo: string }) => row.tipo))];

    return {
      tipos: tiposUnicos,
      sedes: sedesData,
      ciudades: ciudadesData,
      proveedores: proveedoresData
    };
  } catch (error) {
    console.error('Error getting valid values:', error);
    throw error;
  }
};

export const getMenuItems = async (params?: Partial<MenuParams>): Promise<MenuItem[]> => {
  try {
    let query = supabase
      .from('menu_proveedor')
      .select(`
        id,
        plato,
        descripcion,
        precio,
        tipo,
        proveedor:proveedor_id (nombre),
        ciudad:proveedor_id (ciudad:ciudad_id (nombre))
      `);

    if (params?.tipo_reunion) {
      query = query.eq('tipo', params.tipo_reunion);
    }

    if (params?.presupuesto && params?.asistentes) {
      query = query.lte('precio', params.presupuesto / params.asistentes);
    }

    const { data, error } = await query.order('precio', { ascending: true });

    if (error) throw error;

    return data.map((item: any) => ({
      id: item.id,
      plato: item.plato,
      descripcion: item.descripcion,
      tipo: item.tipo,
      precio: item.precio,
      restricciones: [], // Esto se puede agregar si es necesario
      proveedor: item.proveedor?.nombre || '',
      sede: '', // Esto se puede agregar si es necesario
      ciudad: item.ciudad?.ciudad?.nombre || ''
    }));
  } catch (error) {
    console.error('Error getting menu items:', error);
    throw error;
  }
}; 