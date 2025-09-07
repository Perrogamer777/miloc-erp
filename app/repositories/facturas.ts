import { Database } from '../lib/types/database'
import { crearClienteSupabase } from '../lib/supabase/client'

type Factura = Database['public']['Tables']['facturas']['Row']
type NuevaFactura = Database['public']['Tables']['facturas']['Insert']
type ActualizarFactura = Database['public']['Tables']['facturas']['Update']

// Tipo para factura con relación a orden de compra
type FacturaConOrden = Factura & {
  orden_compra?: Database['public']['Tables']['ordenes_compra']['Row']
}

/**
 * Repositorio para operaciones de facturas
 * Maneja todas las operaciones CRUD con la base de datos
 */
export class FacturasRepository {
  
  // ========== OPERACIONES DEL CLIENTE ==========
  
  /**
   * Obtener todas las facturas
   */
  static async obtenerTodas(): Promise<Factura[]> {
    const supabase = crearClienteSupabase()
    
    const { data, error } = await supabase
      .from('facturas')
      .select('*')
      .order('creado_en', { ascending: false })
    
    if (error) {
      throw new Error(`Error al obtener facturas: ${error.message}`)
    }
    
    return data || []
  }
  
  /**
   * Obtener facturas con información de orden de compra
   */
  static async obtenerTodasConOrden(): Promise<FacturaConOrden[]> {
    const supabase = crearClienteSupabase()
    
    const { data, error } = await supabase
      .from('facturas')
      .select(`
        *,
        orden_compra:ordenes_compra(*)
      `)
      .order('creado_en', { ascending: false })
    
    if (error) {
      throw new Error(`Error al obtener facturas con órdenes: ${error.message}`)
    }
    
    return data || []
  }
  
  /**
   * Crear nueva factura
   */
  static async crear(factura: NuevaFactura): Promise<Factura> {
    const supabase = crearClienteSupabase()
    
    const { data, error } = await supabase
      .from('facturas')
      .insert(factura)
      .select()
      .single()
    
    if (error) {
      throw new Error(`Error al crear factura: ${error.message}`)
    }
    
    return data
  }
  
  /**
   * Actualizar factura
   */
  static async actualizar(id: string, cambios: ActualizarFactura): Promise<Factura> {
    const supabase = crearClienteSupabase()
    
    const { data, error } = await supabase
      .from('facturas')
      .update(cambios)
      .eq('id', id)
      .select()
      .single()
    
    if (error) {
      throw new Error(`Error al actualizar factura: ${error.message}`)
    }
    
    return data
  }
  
  /**
   * Eliminar factura
   */
  static async eliminar(id: string): Promise<void> {
    const supabase = crearClienteSupabase()
    
    const { error } = await supabase
      .from('facturas')
      .delete()
      .eq('id', id)
    
    if (error) {
      throw new Error(`Error al eliminar factura: ${error.message}`)
    }
  }
  
  /**
   * Obtener facturas por estado
   */
  static async obtenerPorEstado(estado: string): Promise<Factura[]> {
    const supabase = crearClienteSupabase()
    
    const { data, error } = await supabase
      .from('facturas')
      .select('*')
      .eq('estado', estado)
      .order('fecha_vencimiento', { ascending: true })
    
    if (error) {
      throw new Error(`Error al obtener facturas por estado: ${error.message}`)
    }
    
    return data || []
  }
  
  /**
   * Obtener facturas por orden de compra
   */
  static async obtenerPorOrdenCompra(ordenCompraId: string): Promise<Factura[]> {
    const supabase = crearClienteSupabase()
    
    const { data, error } = await supabase
      .from('facturas')
      .select('*')
      .eq('orden_compra_id', ordenCompraId)
      .order('fecha_factura', { ascending: false })
    
    if (error) {
      throw new Error(`Error al obtener facturas por orden: ${error.message}`)
    }
    
    return data || []
  }
  
  /**
   * Obtener facturas vencidas
   */
  static async obtenerVencidas(): Promise<Factura[]> {
    const supabase = crearClienteSupabase()
    const hoy = new Date().toISOString().split('T')[0]
    
    const { data, error } = await supabase
      .from('facturas')
      .select('*')
      .eq('estado', 'pendiente')
      .lt('fecha_vencimiento', hoy)
      .order('fecha_vencimiento', { ascending: true })
    
    if (error) {
      throw new Error(`Error al obtener facturas vencidas: ${error.message}`)
    }
    
    return data || []
  }
  
  /**
   * Marcar factura como pagada
   */
  static async marcarComoPagada(id: string, fechaPago?: string): Promise<Factura> {
    const supabase = crearClienteSupabase()
    const fecha = fechaPago || new Date().toISOString().split('T')[0]
    
    const { data, error } = await supabase
      .from('facturas')
      .update({
        estado: 'pagada',
        fecha_pago: fecha
      })
      .eq('id', id)
      .select()
      .single()
    
    if (error) {
      throw new Error(`Error al marcar factura como pagada: ${error.message}`)
    }
    
    return data
  }
}