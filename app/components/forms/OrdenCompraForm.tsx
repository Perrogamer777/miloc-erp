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
    email_proveedor: '',
    telefono_proveedor: '',
    monto_total: 0,
    moneda: 'CLP',
    estado: 'pendiente',
    fecha_orden: new Date().toISOString().split('T')[0],
    fecha_entrega_esperada: '',
    notas: archivoUrl ? `📄 Archivo adjunto: ${nombreArchivo || 'documento.pdf'}` : ''
  })

  // Campo adicional para descripción de items
  const [descripcionItems, setDescripcionItems] = useState('')
  
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
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrors({})
    
    try {
      // Agregar descripción de items a las notas
      const datosCompletos = {
        ...formData,
        notas: `${descripcionItems}\n\n${formData.notas || ''}`.trim(),
        // Convertir fechas vacías a undefined para evitar errores de BD
        fecha_entrega_esperada: formData.fecha_entrega_esperada || undefined,
        email_proveedor: formData.email_proveedor || undefined,
        telefono_proveedor: formData.telefono_proveedor || undefined
      }
      
      const resultado = await OrdenesCompraService.crear(datosCompletos)
      
      if (resultado.exito) {
        // Mostrar mensaje de éxito
        setExitoso(true)
        setNumeroOrdenCreada(formData.numero_orden)
        
        onSuccess?.(resultado.datos)
        // Limpiar formulario
        setFormData({
          numero_orden: '',
          nombre_proveedor: '',
          email_proveedor: '',
          telefono_proveedor: '',
          monto_total: 0,
          moneda: 'CLP',
          estado: 'pendiente',
          fecha_orden: new Date().toISOString().split('T')[0],
          fecha_entrega_esperada: '',
          notas: ''
        })
        setDescripcionItems('')
        
        // Limpiar mensaje de éxito después de un momento
        setTimeout(() => {
          setExitoso(false)
          setNumeroOrdenCreada('')
        }, 4000)
      } else {
        // Mostrar errores
        const newErrors: Record<string, string> = {}
        resultado.errores?.forEach(error => {
          if (typeof error === 'string') {
            newErrors.general = error
          }
        })
        setErrors(newErrors)
      }
    } catch (error) {
      setErrors({ general: 'Error inesperado al crear la orden' })
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <Card variant="outlined">
      <CardHeader>
        <CardTitle>Nueva Orden de Compra</CardTitle>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {errors.general && (
            <div className="rounded-md bg-red-50 border border-red-200 p-3">
              <p className="text-sm text-red-600">{errors.general}</p>
            </div>
          )}

          {/* Mensaje de éxito bonito y minimalista */}
          {exitoso && (
            <div className="rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 p-4 shadow-sm">
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
                    ¡Orden de Compra creada exitosamente!
                  </p>
                  <p className="text-xs text-green-600 truncate">
                    Número: {numeroOrdenCreada}
                  </p>
                  <div className="mt-2 flex items-center space-x-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-xs text-green-600">Lista para gestionar</span>
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
          
          {/* Campos básicos simplificados */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Número de Orden de Compra *"
              placeholder="Ej: OC-2024-001"
              value={formData.numero_orden}
              onChange={(e) => handleInputChange('numero_orden', e.target.value)}
              error={errors.numero_orden}
              required
            />
            
            <Input
              label="Monto total sin IVA *"
              type="integer"
              min="0"
              step="1"
              placeholder="0"
              value={formData.monto_total || ''}
              onChange={(e) => handleInputChange('monto_total', parseFloat(e.target.value) || 0)}
              error={errors.monto_total}
              required
            />
          </div>

          {/* Descripción de items */}
          <div className="space-y-1">
            <label className="block text-sm font-bold text-black">
              Descripción de Items *
            </label>
            <textarea
              className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-black placeholder:text-gray-500 font-medium focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
              rows={4}
              placeholder="Describe los servicios de esta orden de compra..."
              value={descripcionItems}
              onChange={(e) => setDescripcionItems(e.target.value)}
              required
            />
          </div>

          {/* Información adicional automática */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Nombre del Proveedor"
              placeholder="Se completará automáticamente"
              value={formData.nombre_proveedor}
              onChange={(e) => handleInputChange('nombre_proveedor', e.target.value)}
              error={errors.nombre_proveedor}
            />
            
            <Input
              label="Fecha de Orden"
              type="date"
              value={formData.fecha_orden}
              onChange={(e) => handleInputChange('fecha_orden', e.target.value)}
              error={errors.fecha_orden}
            />
          </div>
          
          <div className="space-y-1">
            <label className="block text-sm font-bold text-black">
              Notas
            </label>
            <textarea
              className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-black placeholder:text-gray-500 font-medium focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
              rows={3}
              placeholder="Información adicional sobre la orden..."
              value={formData.notas || ''}
              onChange={(e) => handleInputChange('notas', e.target.value)}
            />
          </div>
          
          <div className="flex justify-end space-x-3 pt-4">
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
            
            <Button
              type="submit"
              loading={loading}
              disabled={loading}
            >
              Crear Orden de Compra
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}