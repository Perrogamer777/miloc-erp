'use client'

import { useEffect, useState } from 'react'
import { OrdenesCompraRepository } from '../../repositories/ordenes-compra'
import { Database } from '../../lib/types/database'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/Table'
import Badge, { getEstadoBadgeProps } from '../ui/Badge'
import Button from '../ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card'

type OrdenCompra = Database['public']['Tables']['ordenes_compra']['Row']

interface OrdenesCompraTableProps {
  onEdit?: (orden: OrdenCompra) => void
  onDelete?: (orden: OrdenCompra) => void
  refreshTrigger?: number
}

export default function OrdenesCompraTable({ onEdit, onDelete, refreshTrigger }: OrdenesCompraTableProps) {
  const [ordenes, setOrdenes] = useState<OrdenCompra[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const loadOrdenes = async () => {
    try {
      setLoading(true)
      const data = await OrdenesCompraRepository.obtenerTodas()
      setOrdenes(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar órdenes')
    } finally {
      setLoading(false)
    }
  }
  
  useEffect(() => {
    loadOrdenes()
  }, [refreshTrigger])
  
  const formatearMonto = (monto: number, moneda: string) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: moneda === 'CLP' ? 'CLP' : moneda,
      minimumFractionDigits: 0,
    }).format(monto)
  }
  
  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-CL')
  }
  
  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-black">Cargando órdenes...</span>
          </div>
        </CardContent>
      </Card>
    )
  }
  
  if (error) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={loadOrdenes} variant="outline">
              Reintentar
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }
  
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Órdenes de Compra</CardTitle>
          <div className="text-sm text-black font-medium">
            {ordenes.length} {ordenes.length === 1 ? 'orden' : 'órdenes'}
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {ordenes.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-black mb-4">No hay órdenes de compra registradas</p>
            <p className="text-sm text-black">Crea tu primera orden para comenzar</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-black">Número</TableHead>
                <TableHead className="text-black">Proveedor</TableHead>
                <TableHead className="text-black">Monto</TableHead>
                <TableHead className="text-black">Estado</TableHead>
                <TableHead className="text-black">Fecha Orden</TableHead>
                <TableHead className="text-black">Entrega Esperada</TableHead>
                <TableHead className="text-black">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            
            <TableBody>
              {ordenes.map((orden) => {
                const estadoBadge = getEstadoBadgeProps(orden.estado)
                
                return (
                  <TableRow key={orden.id}>
                    <TableCell className="font-medium text-black">
                      {orden.numero_orden}
                    </TableCell>
                    
                    <TableCell className="text-black">
                      <div>
                        <p className="font-medium">{orden.nombre_proveedor}</p>
                        {orden.email_proveedor && (
                          <p className="text-sm">{orden.email_proveedor}</p>
                        )}
                      </div>
                    </TableCell>
                    
                    <TableCell className="text-black">
                      {formatearMonto(Number(orden.monto_total), orden.moneda)}
                    </TableCell>
                    
                    <TableCell>
                      <Badge variant={estadoBadge.variant} size="sm">
                        {estadoBadge.children}
                      </Badge>
                    </TableCell>
                    
                    <TableCell className="text-black">
                      {formatearFecha(orden.fecha_orden)}
                    </TableCell>
                    
                    <TableCell className="text-black">
                      {orden.fecha_entrega_esperada 
                        ? formatearFecha(orden.fecha_entrega_esperada)
                        : '-'
                      }
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex space-x-2">
                        {onEdit && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onEdit(orden)}
                          >
                            Editar
                          </Button>
                        )}
                        
                        {onDelete && orden.estado === 'pendiente' && (
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => onDelete(orden)}
                          >
                            Eliminar
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}