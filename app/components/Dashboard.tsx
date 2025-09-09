'use client'

import { useEffect, useState } from 'react'
import { FacturasService } from '../services/facturas.service'
import { OrdenesCompraRepository } from '../repositories/ordenes-compra'
import StatCard from './ui/StatCard'
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card'
import OrdenesCompraTable from './tables/OrdenesCompraTable'

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalFacturas: 0,
    montoTotalFacturado: 0,
    ordenesCompraRecibidas: 0
  })
  
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    loadStats()
  }, [])
  
  const loadStats = async () => {
    try {
      // Obtener todas las facturas
      const todasFacturas = await FacturasService.obtenerTodas()
      
      // Calcular métricas de facturas
      const totalFacturas = todasFacturas.length
      const montoTotal = todasFacturas.reduce((sum, f) => sum + Number(f.monto_total), 0)
      
      // Obtener datos reales de órdenes de compra
      const ordenesRecibidas = await OrdenesCompraRepository.obtenerTodas()
      
      setStats({
        totalFacturas: totalFacturas,
        montoTotalFacturado: montoTotal,
        ordenesCompraRecibidas: ordenesRecibidas.length
      })
    } catch (error) {
      console.error('Error loading stats:', error)
      // En caso de error, mantener valores en 0
      setStats({
        totalFacturas: 0,
        montoTotalFacturado: 0,
        ordenesCompraRecibidas: 0
      })
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
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-900">Cargando dashboard...</span>
      </div>
    )
  }
  
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-black mb-2">Dashboard</h1>
        <p className="text-black font-medium">Resumen general</p>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Facturas"
          value={stats.totalFacturas}
          icon={
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14,2 14,8 20,8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
            </svg>
          }
          color="blue"
        />
        
        <StatCard
          title="Monto Total Facturado"
          value={formatCurrency(stats.montoTotalFacturado)}
          icon={
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="1" x2="12" y2="23"/>
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
            </svg>
          }
          color="green"
        />
        
        <StatCard
          title="Órdenes de Compra"
          value={stats.ordenesCompraRecibidas}
          icon={
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
              <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
              <path d="m9 12 2 2 4-4"/>
            </svg>
          }
          color="purple"
        />
      </div>
      
      {/* Recent Orders */}
      <Card>
        <CardHeader>
          <CardTitle>Órdenes Recientes</CardTitle>
        </CardHeader>
        <CardContent>
          <OrdenesCompraTable refreshTrigger={0} />
        </CardContent>
      </Card>
    </div>
  )
}