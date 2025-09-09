import { Database } from '../lib/types/database'
import { crearClienteSupabase } from '../lib/supabase/client'
import { SupabaseStorageService } from '../lib/supabase/storage'

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
  
  // ========== MÉTODOS PRIVADOS PARA MANEJO DE ARCHIVOS ==========
  
  /**
   * Verificar si la orden tiene un archivo asociado
   */
  private static tieneArchivoAsociado(orden: OrdenCompra): boolean {
    // Verificar si existe alguno de estos campos que podrían contener la URL del PDF
    return !!(orden as any).archivo_pdf_url || 
           !!(orden as any).pdf_url || 
           !!(orden as any).archivo_url ||
           // O verificar en las notas si hay referencia al archivo
           (orden.notas && orden.notas.includes('📄 Archivo adjunto:'))
  }
  
  /**
   * Extraer la ruta del archivo desde la orden
   */
  private static extraerRutaDelArchivo(orden: OrdenCompra): string | null {
    // Intentar obtener la ruta desde diferentes campos posibles
    const urlArchivo = (orden as any).archivo_pdf_url || 
                      (orden as any).pdf_url || 
                      (orden as any).archivo_url
    
    if (urlArchivo) {
      return this.extraerRutaDeUrl(urlArchivo)
    }
    
    // Si no hay URL directa, intentar extraer de las notas
    if (orden.notas && orden.notas.includes('📄 Archivo adjunto:')) {
      // Las notas podrían contener información del archivo
      // Generar ruta basada en el número de orden
      return `ordenes_compra/${orden.numero_orden}_*.pdf`
    }
    
    return null
  }
  
  /**
   * Extraer ruta del archivo desde una URL completa
   */
  private static extraerRutaDeUrl(url: string): string | null {
    try {
      // Extraer la ruta del archivo desde la URL de Supabase
      // Formato esperado: https://[project].supabase.co/storage/v1/object/public/documentos/ruta/archivo.pdf
      const urlObj = new URL(url)
      const pathname = urlObj.pathname
      
      // Buscar 'documentos/' en el path y extraer todo lo que viene después
      const match = pathname.match(/\/documentos\/(.+)$/)
      if (match && match[1]) {
        return match[1] // Retorna solo la ruta relativa dentro del bucket
      }
      
      // Si no coincide con el formato esperado, intentar extraer el último segmento
      const segments = pathname.split('/')
      const fileName = segments[segments.length - 1]
      if (fileName && fileName.endsWith('.pdf')) {
        return `ordenes_compra/${fileName}`
      }
      
    } catch (error) {
      console.error('Error al extraer ruta de URL:', error)
    }
    
    return null
  }
}