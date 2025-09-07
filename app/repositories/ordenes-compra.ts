import { Database } from '../lib/types/database'
import { crearClienteSupabase } from '../lib/supabase/client'

type OrdenCompra = Database['public']['Tables']['ordenes_compra']['Row']
type NuevaOrdenCompra = Database['public']['Tables']['ordenes_compra']['Insert']
type ActualizarOrdenCompra = Database['public']['Tables']['ordenes_compra']['Update']

/**
 * Repositorio para operaciones de órdenes de compra
 * Maneja todas las operaciones CRUD con la base de datos
 */
export class OrdenesCompraRepository {
  
  // ========== OPERACIONES DEL CLIENTE ==========
  
  /**
   * Obtener todas las órdenes de compra
   */
  static async obtenerTodas(): Promise<OrdenCompra[]> {
    const supabase = crearClienteSupabase()
    
    const { data, error } = await supabase
      .from('ordenes_compra')
      .select('*')
      .order('creado_en', { ascending: false })
    
    if (error) {
      throw new Error(`Error al obtener órdenes de compra: ${error.message}`)
    }
    
    return data || []
  }
  
  /**
   * Crear nueva orden de compra
   */
  static async crear(orden: NuevaOrdenCompra): Promise<OrdenCompra> {
    const supabase = crearClienteSupabase()
    
    const { data, error } = await supabase
      .from('ordenes_compra')
      .insert(orden)
      .select()
      .single()
    
    if (error) {
      throw new Error(`Error al crear orden de compra: ${error.message}`)
    }
    
    return data
  }
  
  /**
   * Actualizar orden de compra
   */
  static async actualizar(id: string, cambios: ActualizarOrdenCompra): Promise<OrdenCompra> {
    const supabase = crearClienteSupabase()
    
    const { data, error } = await supabase
      .from('ordenes_compra')
      .update(cambios)
      .eq('id', id)
      .select()
      .single()
    
    if (error) {
      throw new Error(`Error al actualizar orden de compra: ${error.message}`)
    }
    
    return data
  }
  
  /**
   * Eliminar orden de compra
   */
  static async eliminar(id: string): Promise<void> {
    const supabase = crearClienteSupabase()
    
    const { error } = await supabase
      .from('ordenes_compra')
      .delete()
      .eq('id', id)
    
    if (error) {
      throw new Error(`Error al eliminar orden de compra: ${error.message}`)
    }
  }
  
  /**
   * Obtener órdenes por estado
   */
  static async obtenerPorEstado(estado: string): Promise<OrdenCompra[]> {
    const supabase = crearClienteSupabase()
    
    const { data, error } = await supabase
      .from('ordenes_compra')
      .select('*')
      .eq('estado', estado)
      .order('fecha_orden', { ascending: false })
    
    if (error) {
      throw new Error(`Error al obtener órdenes por estado: ${error.message}`)
    }
    
    return data || []
  }
  
  /**
   * Buscar órdenes por proveedor
   */
  static async buscarPorProveedor(nombreProveedor: string): Promise<OrdenCompra[]> {
    const supabase = crearClienteSupabase()
    
    const { data, error } = await supabase
      .from('ordenes_compra')
      .select('*')
      .ilike('nombre_proveedor', `%${nombreProveedor}%`)
      .order('creado_en', { ascending: false })
    
    if (error) {
      throw new Error(`Error al buscar órdenes por proveedor: ${error.message}`)
    }
    
    return data || []
  }
}