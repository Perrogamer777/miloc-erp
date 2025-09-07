'use client'

import { useState } from 'react'
import OrdenesCompraTable from "./components/tables/OrdenesCompraTable";
import OrdenCompraForm from "./components/forms/OrdenCompraForm";
import { Card, CardHeader, CardTitle, CardContent } from "./components/ui/Card";

export default function Home() {
  const [refreshTable, setRefreshTable] = useState(0)
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🏢 MILOC ERP - Sistema de Gestión
          </h1>
          <p className="text-gray-600">Gestión de órdenes de compra y facturas</p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Nueva Orden de Compra</CardTitle>
            </CardHeader>
            <CardContent>
              <OrdenCompraForm onSuccess={() => setRefreshTable(prev => prev + 1)} />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Órdenes Registradas</CardTitle>
            </CardHeader>
            <CardContent>
              <OrdenesCompraTable refreshTrigger={refreshTable} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}