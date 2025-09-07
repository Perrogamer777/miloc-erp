'use client'

import { useState, useRef } from 'react'
import { OCRService, DatosExtraidos } from '../../lib/services/ocr.service'
import { SupabaseStorageService, generarRutaArchivo, obtenerTipoArchivo, validarTamanoArchivo } from '../../lib/supabase/storage'

interface PDFUploadProps {
  onDatosExtraidos: (datos: DatosExtraidos, archivoUrl?: string) => void
  tipo: 'facturas' | 'ordenes_compra'
  disabled?: boolean
}

export default function PDFUpload({ onDatosExtraidos, tipo, disabled = false }: PDFUploadProps) {
  const [procesando, setProcesando] = useState(false)
  const [progreso, setProgreso] = useState('')
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const archivo = event.target.files?.[0]
    if (!archivo) return

    // Validaciones
    if (!obtenerTipoArchivo(archivo)) {
      setError('Por favor selecciona un archivo PDF válido')
      return
    }

    if (!validarTamanoArchivo(archivo, 10)) {
      setError('El archivo es demasiado grande. Máximo 10MB')
      return
    }

    await procesarArchivo(archivo)
  }

  const procesarArchivo = async (archivo: File) => {
    setProcesando(true)
    setError('')
    setProgreso('Subiendo archivo...')
    
    try {
      // 1. Subir a Supabase Storage
      const rutaArchivo = generarRutaArchivo(tipo, `temp_${Date.now()}`)
      const { data: uploadData, error: uploadError } = await SupabaseStorageService.subirArchivo(
        'documentos',
        archivo,
        rutaArchivo
      )

      if (uploadError) {
        throw new Error('Error subiendo archivo: ' + uploadError.message)
      }

      setProgreso('Procesando con OCR...')

      // 2. Procesar con OCR
      const datosExtraidos = await OCRService.procesarPDF(archivo)
      
      if (!datosExtraidos) {
        throw new Error('No se pudieron extraer datos del PDF')
      }

      setProgreso('Obteniendo URL del archivo...')

      // 3. Obtener URL pública
      const archivoUrl = await SupabaseStorageService.obtenerUrlPublica('documentos', rutaArchivo)

      setProgreso('¡Completado!')
      
      // 4. Notificar al componente padre
      onDatosExtraidos(datosExtraidos, archivoUrl || undefined)
      
      // Reset
      if (inputRef.current) {
        inputRef.current.value = ''
      }
      
    } catch (err) {
      console.error('Error procesando archivo:', err)
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setProcesando(false)
      setProgreso('')
    }
  }

  const triggerFileSelect = () => {
    inputRef.current?.click()
  }

  return (
    <div className="w-full">
      {/* Input oculto */}
      <input
        ref={inputRef}
        type="file"
        accept=".pdf"
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled || procesando}
      />

      {/* Área de drag & drop */}
      <div
        onClick={triggerFileSelect}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
          ${procesando || disabled
            ? 'border-gray-300 bg-gray-50 cursor-not-allowed'
            : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
          }
        `}
      >
        {procesando ? (
          <div className="space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <div>
              <p className="text-blue-600 font-medium">Procesando PDF...</p>
              {progreso && <p className="text-sm text-gray-600">{progreso}</p>}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="mx-auto w-16 h-16 text-gray-400">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14,2 14,8 20,8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
                <polyline points="10,9 9,9 8,9"/>
              </svg>
            </div>
            <div>
              <p className="text-lg font-medium text-gray-900">
                Subir {tipo === 'facturas' ? 'Factura' : 'Orden de Compra'}
              </p>
              <p className="text-gray-600">
                Arrastra y suelta tu PDF aquí, o haz clic para seleccionar
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Los datos se extraerán automáticamente del documento
              </p>
            </div>
            <div className="flex items-center justify-center">
              <button
                type="button"
                disabled={disabled || procesando}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Seleccionar Archivo PDF
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Mensaje de error */}
      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <svg className="w-5 h-5 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="15" y1="9" x2="9" y2="15"/>
              <line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Información de ayuda */}
      <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h4 className="font-medium text-blue-900 mb-2">📄 Datos que se extraerán automáticamente:</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• RUT de la empresa</li>
          <li>• Nombre de la empresa</li>
          <li>• Número de documento</li>
          <li>• Fecha de emisión</li>
          <li>• Montos (neto, IVA, total)</li>
        </ul>
      </div>
    </div>
  )
}