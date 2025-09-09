'use client'

import { useState, useEffect } from 'react'
import { OrdenesCompraService } from '../../services/ordenes-compra.service'
import { CrearOrdenCompraInput } from '../../lib/validations/schemas'
import Button from '../ui/Button'
import Input from '../ui/Input'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card'

interface OrdenCompraFormProps {
  onSuccess?: (orden: any) => void
  onCancel?: () => void
  archivoUrl?: string
  nombreArchivo?: string
}

export default function OrdenCompraForm({ onSuccess, onCancel, archivoUrl, nombreArchivo }: OrdenCompraFormProps) {
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [exitoso, setExitoso] = useState(false)
  const [numeroOrdenCreada, setNumeroOrdenCreada] = useState<string>('')
  
  const [formData, setFormData] = useState<CrearOrdenCompraInput>({
    numero_orden: '',
    nombre_proveedor: '',
    monto_total: 0,
    estado: 'pendiente',
    fecha_orden: new Date().toISOString().split('T')[0],
    fecha_entrega_esperada: '',
    url_pdf: archivoUrl || '',
    notas: archivoUrl ? `📄 Archivo adjunto: ${nombreArchivo || 'documento.pdf'}` : ''
  })
  
  const handleInputChange = (field: keyof CrearOrdenCompraInput, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    
    // Limpiar error cuando el usuario empiece a escribir
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  // Actualizar URL del archivo cuando cambie
  useEffect(() => {
    if (archivoUrl) {
      setFormData(prev => ({
        ...prev,
        url_pdf: archivoUrl,
        notas: `📄 Archivo adjunto: ${nombreArchivo || 'documento.pdf'}`
      }))
    }
  }, [archivoUrl, nombreArchivo])

  const validarFormulario = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.nombre_proveedor.trim()) {
      newErrors.nombre_proveedor = 'El nombre del proveedor es requerido'
    }

    if (formData.monto_total <= 0) {
      newErrors.monto_total = 'El monto debe ser mayor a 0'
    }

    // Ya no validamos email ni teléfono

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validarFormulario()) {
      return
    }
    
    setLoading(true)
    
    try {
      const resultado = await OrdenesCompraService.crear(formData)
      
      if (resultado.exito && resultado.datos) {
        setExitoso(true)
        setNumeroOrdenCreada(resultado.datos.numero_orden)
        
        // Notificar éxito al componente padre
        if (onSuccess) {
          onSuccess(resultado.datos)
        }
        
        // Limpiar formulario después de 3 segundos
        setTimeout(() => {
          setExitoso(false)
          setFormData({
            numero_orden: '',
            nombre_proveedor: '',
            monto_total: 0,
            estado: 'pendiente',
            fecha_orden: new Date().toISOString().split('T')[0],
            fecha_entrega_esperada: '',
            url_pdf: '',
            notas: ''
          })
        }, 3000)
        
      } else {
        // Mostrar errores del servidor
        const erroresServidor: Record<string, string> = {}
        resultado.errores?.forEach((error, index) => {
          erroresServidor[`server_${index}`] = error
        })
        setErrors(erroresServidor)
      }
      
    } catch (error) {
      console.error('Error al crear orden:', error)
      setErrors({ general: 'Error inesperado. Por favor intenta de nuevo.' })
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  if (exitoso) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-black mb-2">¡Orden de Compra Creada!</h3>
            <p className="text-black mb-4">
              La orden <span className="font-bold">{numeroOrdenCreada}</span> ha sido registrada exitosamente.
            </p>
            <div className="space-y-2 text-sm text-black">
              <p><strong>Proveedor:</strong> {formData.nombre_proveedor}</p>
              <p><strong>Monto:</strong> {formatCurrency(formData.monto_total)}</p>
              {archivoUrl && <p><strong>Archivo:</strong> Documento adjuntado ✓</p>}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Nueva Orden de Compra</CardTitle>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-4">
            <div>
              <Input
                label="Número de Orden (opcional)"
                value={formData.numero_orden}
                onChange={(e) => handleInputChange('numero_orden', e.target.value)}
                placeholder="Se generará automáticamente si se deja vacío"
                error={errors.numero_orden}
              />
            </div>

            <div>
              <Input
                label="Nombre del Proveedor *"
                value={formData.nombre_proveedor}
                onChange={(e) => handleInputChange('nombre_proveedor', e.target.value)}
                placeholder="Nombre de la empresa proveedora"
                error={errors.nombre_proveedor}
              />
            </div>

            {/* Estado */}
            <div>
              <label className="block text-sm font-medium text-black mb-2">
                Estado de la Orden
              </label>
              <select
                value={formData.estado}
                onChange={(e) => handleInputChange('estado', e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-black focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
              >
                <option value="pendiente">Pendiente</option>
                <option value="enviada">Enviada</option>
                <option value="entregada">Entregada</option>
                <option value="cancelada">Cancelada</option>
              </select>
            </div>

            <div>
              <Input
                label="Monto Total *"
                type="number"
                step="1"
                min="0"
                value={formData.monto_total}
                onChange={(e) => handleInputChange('monto_total', Number(e.target.value))}
                placeholder="0"
                error={errors.monto_total}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Input
                  label="Fecha de la Orden *"
                  type="date"
                  value={formData.fecha_orden}
                  onChange={(e) => handleInputChange('fecha_orden', e.target.value)}
                  error={errors.fecha_orden}
                />
              </div>
              
              <div>
                <Input
                  label="Fecha de Entrega Esperada"
                  type="date"
                  value={formData.fecha_entrega_esperada}
                  onChange={(e) => handleInputChange('fecha_entrega_esperada', e.target.value)}
                  error={errors.fecha_entrega_esperada}
                />
              </div>
            </div>

            {archivoUrl && (
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-center space-x-2">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  <span className="text-green-800 font-medium">
                    Documento adjuntado: {nombreArchivo || 'documento.pdf'}
                  </span>
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-black mb-2">
                Notas Adicionales
              </label>
              <textarea
                value={formData.notas}
                onChange={(e) => handleInputChange('notas', e.target.value)}
                placeholder="Observaciones o notas adicionales..."
                rows={3}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-black placeholder:text-gray-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
              />
              {errors.notas && (
                <p className="mt-1 text-sm text-red-600">{errors.notas}</p>
              )}
            </div>
          </div>

          {/* Mostrar errores del servidor */}
          {Object.keys(errors).some(key => key.startsWith('server_')) && (
            <div className="bg-red-50 p-4 rounded-lg">
              <h4 className="font-semibold text-red-800 mb-2">Errores:</h4>
              <ul className="text-sm text-red-700 space-y-1">
                {Object.entries(errors)
                  .filter(([key]) => key.startsWith('server_'))
                  .map(([key, error]) => (
                    <li key={key}>• {error}</li>
                  ))}
              </ul>
            </div>
          )}

          {errors.general && (
            <div className="bg-red-50 p-4 rounded-lg">
              <p className="text-sm text-red-700">{errors.general}</p>
            </div>
          )}

          {/* Botones */}
          <div className="flex space-x-3 pt-4">
            <Button 
              type="submit" 
              disabled={loading}
              className="flex-1"
            >
              {loading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Guardando...</span>
                </div>
              ) : (
                'Crear Orden de Compra'
              )}
            </Button>
            
            {onCancel && (
              <Button 
                type="button" 
                variant="outline" 
                onClick={onCancel}
                disabled={loading}
              >
                Cancelar
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  )
}