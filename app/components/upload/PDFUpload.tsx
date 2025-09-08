'use client'

import { useState, useRef, useEffect } from 'react'
import { UploadService } from '../../lib/services/ocr.service'
import { SupabaseStorageService, generarRutaArchivo, validarTamanoArchivo } from '../../lib/supabase/storage'

interface PDFUploadProps {
  onArchivoSubido: (archivoUrl: string, nombreArchivo: string) => void
  tipo: 'facturas' | 'ordenes_compra'
  disabled?: boolean
}

export default function PDFUpload({ onArchivoSubido, tipo, disabled = false }: PDFUploadProps) {
  const [subiendo, setSubiendo] = useState(false)
  const [progreso, setProgreso] = useState('')
  const [error, setError] = useState('')
  const [archivoSeleccionado, setArchivoSeleccionado] = useState<File | null>(null)
  const [urlPreview, setUrlPreview] = useState<string | null>(null)
  const [exitoso, setExitoso] = useState(false)
  const [nombreArchivoSubido, setNombreArchivoSubido] = useState<string>('')
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const archivo = event.target.files?.[0]
    if (!archivo) return

    // Limpiar estado anterior
    if (urlPreview) {
      URL.revokeObjectURL(urlPreview)
      setUrlPreview(null)
    }
    setArchivoSeleccionado(null)
    setError('')
    setExitoso(false)
    setProgreso('')

    // Validaciones básicas
    if (!UploadService.esArchivoValido(archivo)) {
      setError('Por favor selecciona un archivo PDF o una imagen (PNG, JPG, JPEG)')
      return
    }

    if (!UploadService.validarTamano(archivo, 10)) {
      setError('El archivo es demasiado grande. Máximo 10MB')
      return
    }

    // Guardar archivo para previsualización
    setArchivoSeleccionado(archivo)
    
    // Crear URL de previsualización
    const url = URL.createObjectURL(archivo)
    setUrlPreview(url)

    await subirArchivo(archivo)
  }

  const subirArchivo = async (archivo: File) => {
    setSubiendo(true)
    setError('')
    setProgreso('Subiendo archivo...')
    
    try {
      // 1. Subir a Supabase Storage
      const rutaArchivo = generarRutaArchivo(tipo, `${Date.now()}_${archivo.name}`)
      const { data: uploadData, error: uploadError } = await SupabaseStorageService.subirArchivo(
        'documentos',
        archivo,
        rutaArchivo
      )

      if (uploadError) {
        throw new Error('Error subiendo archivo: ' + uploadError.message)
      }

      setProgreso('Obteniendo URL del archivo...')

      // 2. Obtener URL pública
      const archivoUrl = await SupabaseStorageService.obtenerUrlPublica('documentos', rutaArchivo)
      
      if (!archivoUrl) {
        throw new Error('No se pudo obtener la URL del archivo')
      }

      // 3. Marcar como exitoso y notificar
      setExitoso(true)
      setNombreArchivoSubido(archivo.name)
      onArchivoSubido(archivoUrl, archivo.name)
      
      // Reset
      if (inputRef.current) {
        inputRef.current.value = ''
      }
      
      // Limpiar mensaje de éxito después de un momento
      setTimeout(() => {
        setExitoso(false)
        setProgreso('')
      }, 3000)
      
    } catch (err) {
      console.error('Error subiendo archivo:', err)
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setSubiendo(false)
    }
  }

  // Limpiar URLs de objeto cuando el componente se desmonte
  useEffect(() => {
    return () => {
      if (urlPreview) {
        URL.revokeObjectURL(urlPreview)
      }
    }
  }, [urlPreview])

  const triggerFileSelect = () => {
    inputRef.current?.click()
  }

  return (
    <div className="w-full">
      {/* Input oculto */}
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.png,.jpg,.jpeg"
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled || subiendo}
      />

      {/* Área de drag & drop */}
      <div
        onClick={triggerFileSelect}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
          ${subiendo || disabled
            ? 'border-gray-300 bg-gray-50 cursor-not-allowed'
            : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
          }
        `}
      >
        {subiendo ? (
          <div className="space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <div>
              <p className="text-blue-600 font-medium">Subiendo archivo...</p>
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
              <p className="text-lg font-bold text-black">
                Subir {tipo === 'facturas' ? 'Factura' : 'Orden de Compra'}
              </p>
              <p className="text-black font-medium">
                Arrastra y suelta tu PDF aquí, o haz clic para seleccionar
              </p>
              <p className="text-sm text-black mt-2 font-medium">
                El documento se guardará para referencia futura
              </p>
              <p className="text-xs text-black mt-1 font-medium">
                Formatos: PDF, PNG, JPG, JPEG (máx. 10MB)
              </p>
            </div>
            <div className="flex items-center justify-center">
              <button
                type="button"
                disabled={disabled || subiendo}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Seleccionar Archivo
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

      {/* Mensaje de éxito bonito y minimalista */}
      {exitoso && (
        <div className="mt-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl shadow-sm">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center shadow-sm">
                <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 12l2 2 4-4"/>
                  <circle cx="12" cy="12" r="10"/>
                </svg>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-green-800 mb-1">
                ¡Archivo subido exitosamente!
              </p>
              <p className="text-xs text-green-600 truncate">
                {nombreArchivoSubido}
              </p>
              <div className="mt-2 flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs text-green-600">Listo para usar</span>
              </div>
            </div>
            <button 
              onClick={() => setExitoso(false)}
              className="flex-shrink-0 text-green-400 hover:text-green-600 transition-colors"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Previsualización del archivo */}
      {archivoSeleccionado && urlPreview && (
        <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <div className="flex items-center space-x-3 mb-3">
            <svg className="w-5 h-5 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14,2 14,8 20,8"/>
            </svg>
            <div>
              <p className="text-sm font-bold text-black">Archivo seleccionado:</p>
              <p className="text-xs text-black">{archivoSeleccionado.name}</p>
            </div>
          </div>
          
          <div className="w-full h-64 border border-gray-300 rounded-lg overflow-hidden bg-white">
            {archivoSeleccionado.type === 'application/pdf' ? (
              <iframe
                src={urlPreview}
                className="w-full h-full"
                title="Previsualización PDF"
                frameBorder="0"
              />
            ) : (
              <img
                src={urlPreview}
                alt="Previsualización"
                className="w-full h-full object-contain"
              />
            )}
          </div>
        </div>
      )}
    </div>
  )
}