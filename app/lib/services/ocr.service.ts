// Servicio simplificado solo para subida de archivos (sin OCR)
export class UploadService {
  // Validar que el archivo sea PDF
  static esPDF(archivo: File): boolean {
    return archivo.type === 'application/pdf'
  }

  // Validar que el archivo sea una imagen
  static esImagen(archivo: File): boolean {
    return archivo.type.startsWith('image/')
  }

  // Validar archivo permitido (PDF o imagen)
  static esArchivoValido(archivo: File): boolean {
    return this.esPDF(archivo) || this.esImagen(archivo)
  }

  // Validar tamaño máximo del archivo (MB)
  static validarTamano(archivo: File, maxSizeMB: number = 10): boolean {
    const maxBytes = maxSizeMB * 1024 * 1024
    return archivo.size <= maxBytes
  }

  // Obtener información básica del archivo
  static obtenerInfoArchivo(archivo: File) {
    return {
      nombre: archivo.name,
      tamano: archivo.size,
      tipo: archivo.type,
      extension: archivo.name.split('.').pop()?.toLowerCase() || ''
    }
  }
}