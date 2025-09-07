'use client'

import { useState, useEffect } from 'react'
import { OrdenesCompraService } from '../../services/ordenes-compra.service'
import { CrearOrdenCompraInput } from '../../lib/validations/schemas'
import { DatosExtraidos } from '../../lib/services/ocr.service'
import Button from '../ui/Button'
import Input from '../ui/Input'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card'

interface OrdenCompraFormProps {
  onSuccess?: (orden: any) => void
  onCancel?: () => void
  datosIniciales?: DatosExtraidos | null
}

export default function OrdenCompraForm({ onSuccess, onCancel, datosIniciales }: OrdenCompraFormProps) {
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  
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
    notas: ''
  })

  // Efecto para cargar datos extraídos del PDF
  useEffect(() => {
    if (datosIniciales) {
      setFormData(prev => ({
        ...prev,
        numero_orden: datosIniciales.numeroDocumento || '',
        nombre_proveedor: datosIniciales.nombreEmpresa || '',
        monto_total: datosIniciales.montoTotal || 0,
        fecha_orden: datosIniciales.fecha || new Date().toISOString().split('T')[0],
        notas: `📄 Datos extraídos automáticamente del PDF\n${datosIniciales.rut ? `RUT: ${datosIniciales.rut}\n` : ''}${datosIniciales.montoNeto ? `Monto Neto: $${datosIniciales.montoNeto.toLocaleString('es-CL')}\n` : ''}${datosIniciales.iva ? `IVA: $${datosIniciales.iva.toLocaleString('es-CL')}\n` : ''}`
      }))
      // Limpiar errores previos
      setErrors({})
    }
  }, [datosIniciales])
  
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
      const resultado = await OrdenesCompraService.crear(formData)
      
      if (resultado.exito) {
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
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Número de Orden"
              placeholder="Se generará automáticamente si se deja vacío"
              value={formData.numero_orden}
              onChange={(e) => handleInputChange('numero_orden', e.target.value)}
              error={errors.numero_orden}
            />
            
            <Input
              label="Nombre del Proveedor *"
              placeholder="Ej: Empresa Proveedora S.A."
              value={formData.nombre_proveedor}
              onChange={(e) => handleInputChange('nombre_proveedor', e.target.value)}
              error={errors.nombre_proveedor}
              required
            />
            
            <Input
              label="Email del Proveedor"
              type="email"
              placeholder="contacto@proveedor.com"
              value={formData.email_proveedor || ''}
              onChange={(e) => handleInputChange('email_proveedor', e.target.value)}
              error={errors.email_proveedor}
            />
            
            <Input
              label="Teléfono del Proveedor"
              placeholder="+56 9 1234 5678"
              value={formData.telefono_proveedor || ''}
              onChange={(e) => handleInputChange('telefono_proveedor', e.target.value)}
              error={errors.telefono_proveedor}
            />
            
            <Input
              label="Monto Total *"
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={formData.monto_total || ''}
              onChange={(e) => handleInputChange('monto_total', parseFloat(e.target.value) || 0)}
              error={errors.monto_total}
              required
            />
            
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">
                Moneda *
              </label>
              <select
                className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                value={formData.moneda}
                onChange={(e) => handleInputChange('moneda', e.target.value)}
              >
                <option value="CLP">CLP - Peso Chileno</option>
                <option value="USD">USD - Dólar Americano</option>
                <option value="EUR">EUR - Euro</option>
              </select>
            </div>
            
            <Input
              label="Fecha de Orden *"
              type="date"
              value={formData.fecha_orden}
              onChange={(e) => handleInputChange('fecha_orden', e.target.value)}
              error={errors.fecha_orden}
              required
            />
            
            <Input
              label="Fecha de Entrega Esperada"
              type="date"
              value={formData.fecha_entrega_esperada || ''}
              onChange={(e) => handleInputChange('fecha_entrega_esperada', e.target.value)}
              error={errors.fecha_entrega_esperada}
            />
          </div>
          
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">
              Notas
            </label>
            <textarea
              className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
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