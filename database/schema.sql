-- Schema completo para MILOC ERP
-- Flujo: Cotización → Orden de Compra → Factura

-- Tabla de empresas (que aprueban cotizaciones y envían órdenes de compra)
CREATE TABLE empresas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rut TEXT NOT NULL UNIQUE,
  nombre TEXT NOT NULL,
  contacto_principal TEXT,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Tabla de cotizaciones (básica, solo para mantener relaciones)
CREATE TABLE cotizaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_cotizacion TEXT NOT NULL UNIQUE,
  empresa_id UUID REFERENCES empresas(id),
  descripcion TEXT NOT NULL,
  monto_total DECIMAL(12,2) NOT NULL,
  fecha_envio DATE NOT NULL DEFAULT CURRENT_DATE,
  estado TEXT NOT NULL CHECK (estado IN ('enviada', 'aceptada', 'rechazada')) DEFAULT 'enviada',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Tabla de órdenes de compra (recibidas de las empresas)
CREATE TABLE ordenes_compra (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_orden TEXT NOT NULL UNIQUE,
  cotizacion_id UUID REFERENCES cotizaciones(id),
  empresa_rut TEXT NOT NULL,
  empresa_nombre TEXT NOT NULL,
  fecha_recepcion DATE NOT NULL DEFAULT CURRENT_DATE,
  fecha_entrega DATE,
  descripcion_trabajo TEXT NOT NULL,
  monto_neto DECIMAL(12,2) NOT NULL,
  iva DECIMAL(12,2) NOT NULL DEFAULT 0,
  monto_total DECIMAL(12,2) NOT NULL,
  estado TEXT NOT NULL CHECK (estado IN ('recibida', 'en_proceso', 'completada', 'facturada')) DEFAULT 'recibida',
  archivo_pdf_url TEXT,
  observaciones TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Tabla de facturas (emitidas por nosotros)
CREATE TABLE facturas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_factura TEXT NOT NULL UNIQUE,
  orden_compra_id UUID REFERENCES ordenes_compra(id),
  tipo_documento TEXT NOT NULL CHECK (tipo_documento IN ('factura_electronica', 'boleta', 'nota_credito', 'nota_debito')) DEFAULT 'factura_electronica',
  timbre_electronico TEXT,
  folio_sii TEXT,
  empresa_rut TEXT NOT NULL,
  empresa_nombre TEXT NOT NULL,
  fecha_emision DATE NOT NULL DEFAULT CURRENT_DATE,
  fecha_pago DATE,
  descripcion_trabajo TEXT NOT NULL,
  monto_neto DECIMAL(12,2) NOT NULL,
  iva DECIMAL(12,2) NOT NULL DEFAULT 0,
  monto_total DECIMAL(12,2) NOT NULL,
  estado_pago TEXT NOT NULL CHECK (estado_pago IN ('pendiente', 'pagada', 'anulada')) DEFAULT 'pendiente',
  archivo_pdf_url TEXT,
  observaciones TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Índices para mejorar performance
CREATE INDEX idx_cotizaciones_estado ON cotizaciones(estado);
CREATE INDEX idx_cotizaciones_empresa_id ON cotizaciones(empresa_id);

CREATE INDEX idx_ordenes_compra_estado ON ordenes_compra(estado);
CREATE INDEX idx_ordenes_compra_cotizacion_id ON ordenes_compra(cotizacion_id);

CREATE INDEX idx_facturas_estado_pago ON facturas(estado_pago);
CREATE INDEX idx_facturas_orden_compra_id ON facturas(orden_compra_id);

-- Triggers para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = TIMEZONE('utc'::text, NOW());
   RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_cotizaciones_updated_at BEFORE UPDATE ON cotizaciones FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ordenes_compra_updated_at BEFORE UPDATE ON ordenes_compra FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_facturas_updated_at BEFORE UPDATE ON facturas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_empresas_updated_at BEFORE UPDATE ON empresas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Vista para métricas del dashboard
CREATE OR REPLACE VIEW dashboard_metricas AS
SELECT 
  -- Facturas pendientes de pago
  (SELECT COUNT(*) FROM facturas WHERE estado_pago = 'pendiente') as facturas_pendientes,
  
  -- Monto total pendiente de pago
  (SELECT COALESCE(SUM(monto_total), 0) FROM facturas WHERE estado_pago = 'pendiente') as monto_pendiente_pago,
  
  -- Total de cotizaciones enviadas
  (SELECT COUNT(*) FROM cotizaciones WHERE estado = 'enviada') as cotizaciones_enviadas,
  
  -- Total de órdenes de compra recibidas
  (SELECT COUNT(*) FROM ordenes_compra) as ordenes_compra_recibidas;