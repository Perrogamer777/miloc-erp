import Tesseract from 'tesseract.js'

export interface DatosExtraidos {
  rut?: string
  nombreEmpresa?: string
  numeroDocumento?: string
  fecha?: string
  montoNeto?: number
  iva?: number
  montoTotal?: number
  tipo?: 'factura' | 'orden_compra'
}

export class OCRService {
  // Convertir PDF a imagen usando canvas (enfoque simplificado)
  static async pdfAImagen(archivoPdf: File): Promise<string | null> {
    try {
      // Por ahora, vamos a usar el archivo PDF directamente
      // Tesseract.js puede procesar PDFs directamente en algunos casos
      return URL.createObjectURL(archivoPdf)
    } catch (error) {
      console.error('Error convirtiendo PDF a imagen:', error)
      return null
    }
  }
  
  // Procesar imagen con Tesseract OCR
  static async procesarImagen(imagenUrl: string): Promise<string | null> {
    try {
      const { data: { text } } = await Tesseract.recognize(
        imagenUrl,
        'spa', // Español
        {
          logger: m => console.log(m) // Progress logging
        }
      )
      
      return text
    } catch (error) {
      console.error('Error en OCR:', error)
      return null
    }
  }
  
  // Extraer datos específicos del texto OCR
  static extraerDatos(texto: string): DatosExtraidos {
    const datos: DatosExtraidos = {}
    
    // Detectar tipo de documento
    if (texto.toLowerCase().includes('factura')) {
      datos.tipo = 'factura'
    } else if (texto.toLowerCase().includes('orden de compra')) {
      datos.tipo = 'orden_compra'
    }
    
    // Extraer RUT (formato: XX.XXX.XXX-X)
    const rutRegex = /(\d{1,2}\.\d{3}\.\d{3}-[\dkK])/gi
    const rutMatch = texto.match(rutRegex)
    if (rutMatch) {
      datos.rut = rutMatch[0]
    }
    
    // Extraer número de factura/orden
    const numeroRegex = /(?:n[°º]?\s*|#)\s*(\d+)/gi
    const numeroMatch = texto.match(numeroRegex)
    if (numeroMatch) {
      datos.numeroDocumento = numeroMatch[0].replace(/[^\d]/g, '')
    }
    
    // Extraer fechas (formato DD/MM/YYYY o DD-MM-YYYY)
    const fechaRegex = /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/g
    const fechaMatch = texto.match(fechaRegex)
    if (fechaMatch) {
      datos.fecha = fechaMatch[0]
    }
    
    // Extraer montos en CLP
    const montoRegex = /\$\s*([\d\.,]+)/g
    const montos = Array.from(texto.matchAll(montoRegex))
      .map(match => {
        const monto = match[1].replace(/[,\.]/g, '')
        return parseInt(monto, 10)
      })
      .filter(monto => !isNaN(monto) && monto > 0)
      .sort((a, b) => b - a) // Ordenar descendente
    
    if (montos.length > 0) {
      // El monto más alto suele ser el total
      datos.montoTotal = montos[0]
      
      // Si hay múltiples montos, intentar identificar neto e IVA
      if (montos.length >= 2) {
        // Buscar patrón: si un monto es ~19% de otro, es probable que sea IVA
        for (let i = 0; i < montos.length - 1; i++) {
          for (let j = i + 1; j < montos.length; j++) {
            const ratio = montos[j] / montos[i]
            if (ratio >= 0.18 && ratio <= 0.20) { // ~19% IVA
              datos.montoNeto = montos[i] - montos[j]
              datos.iva = montos[j]
              datos.montoTotal = montos[i]
              break
            }
          }
        }
      }
    }
    
    // Extraer nombre de empresa (buscar después de RUT)
    if (datos.rut) {
      const rutIndex = texto.indexOf(datos.rut)
      const textoPostRut = texto.substring(rutIndex + datos.rut.length, rutIndex + datos.rut.length + 200)
      
      // Buscar líneas con texto en mayúsculas (nombres de empresas)
      const empresaRegex = /([A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑ\s]{10,})/g
      const empresaMatch = textoPostRut.match(empresaRegex)
      if (empresaMatch) {
        datos.nombreEmpresa = empresaMatch[0].trim()
      }
    }
    
    return datos
  }
  
  // Proceso completo: PDF → OCR → Datos extraídos
  static async procesarPDF(archivoPdf: File): Promise<DatosExtraidos | null> {
    try {
      // 1. Convertir PDF a imagen
      const imagenUrl = await this.pdfAImagen(archivoPdf)
      if (!imagenUrl) return null
      
      // 2. Procesar con OCR
      const texto = await this.procesarImagen(imagenUrl)
      if (!texto) return null
      
      // 3. Extraer datos estructurados
      const datos = this.extraerDatos(texto)
      
      console.log('Texto OCR extraído:', texto)
      console.log('Datos estructurados:', datos)
      
      return datos
    } catch (error) {
      console.error('Error procesando PDF:', error)
      return null
    }
  }
}