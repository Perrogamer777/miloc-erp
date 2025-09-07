import { crearClienteSupabase } from './client'

export class SupabaseStorageService {
  private static supabase = crearClienteSupabase()
  
  // Subir archivo PDF
  static async subirArchivo(
    bucket: string,
    archivo: File,
    ruta: string
  ): Promise<{ data: any; error: any }> {
    try {
      const { data, error } = await this.supabase.storage
        .from(bucket)
        .upload(ruta, archivo, {
          cacheControl: '3600',
          upsert: false
        })
      
      return { data, error }
    } catch (error) {
      console.error('Error subiendo archivo:', error)
      return { data: null, error }
    }
  }
  
  // Obtener URL pública del archivo
  static async obtenerUrlPublica(
    bucket: string,
    ruta: string
  ): Promise<string | null> {
    try {
      const { data } = this.supabase.storage
        .from(bucket)
        .getPublicUrl(ruta)
      
      return data.publicUrl
    } catch (error) {
      console.error('Error obteniendo URL pública:', error)
      return null
    }
  }
  
  // Descargar archivo
  static async descargarArchivo(
    bucket: string,
    ruta: string
  ): Promise<{ data: Blob | null; error: any }> {
    try {
      const { data, error } = await this.supabase.storage
        .from(bucket)
        .download(ruta)
      
      return { data, error }
    } catch (error) {
      console.error('Error descargando archivo:', error)
      return { data: null, error }
    }
  }
  
  // Eliminar archivo
  static async eliminarArchivo(
    bucket: string,
    ruta: string
  ): Promise<{ data: any; error: any }> {
    try {
      const { data, error } = await this.supabase.storage
        .from(bucket)
        .remove([ruta])
      
      return { data, error }
    } catch (error) {
      console.error('Error eliminando archivo:', error)
      return { data: null, error }
    }
  }
  
  // Listar archivos en un directorio
  static async listarArchivos(
    bucket: string,
    directorio: string = ''
  ): Promise<{ data: any[] | null; error: any }> {
    try {
      const { data, error } = await this.supabase.storage
        .from(bucket)
        .list(directorio)
      
      return { data, error }
    } catch (error) {
      console.error('Error listando archivos:', error)
      return { data: null, error }
    }
  }
}

// Utilidades para generar rutas de archivos
export const generarRutaArchivo = (
  tipo: 'facturas' | 'ordenes_compra' | 'cotizaciones',
  numeroDocumento: string,
  extension: string = 'pdf'
): string => {
  const timestamp = Date.now()
  return `${tipo}/${numeroDocumento}_${timestamp}.${extension}`
}

export const obtenerTipoArchivo = (archivo: File): boolean => {
  return archivo.type === 'application/pdf'
}

export const validarTamanoArchivo = (archivo: File, maxSizeMB: number = 10): boolean => {
  const maxSizeBytes = maxSizeMB * 1024 * 1024
  return archivo.size <= maxSizeBytes
}