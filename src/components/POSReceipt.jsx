import React, { useRef } from 'react'
import { Printer, Download, X } from 'lucide-react'
import { formatCurrency, formatDate } from '../utils/format'
import { createPortal } from 'react-dom'

const POSReceipt = ({ isOpen, onClose, data, config, staffName }) => {
  const receiptRef = useRef()

  if (!isOpen || !data) return null

  const handlePrint = () => {
    const printContent = receiptRef.current.innerHTML
    const originalContent = document.body.innerHTML
    
    // Create a temporary hidden container for printing
    const printWindow = window.open('', '_blank')
    printWindow.document.write(`
      <html>
        <head>
          <title>Factura - ${data.customer_name || 'Venta'}</title>
          <style>
            @page { size: 80mm auto; margin: 0; }
            body { 
              width: 80mm; 
              margin: 0; 
              padding: 5mm; 
              font-family: 'Courier New', Courier, monospace; 
              font-size: 12px; 
              color: black;
            }
            .center { text-align: center; }
            .bold { font-weight: bold; }
            .divider { border-top: 1px dashed black; margin: 5px 0; }
            .item-row { display: flex; justify-content: space-between; margin: 2px 0; }
            .total-section { margin-top: 10px; font-weight: bold; }
            .footer { margin-top: 15px; font-size: 10px; text-align: center; }
            table { width: 100%; border-collapse: collapse; }
            th { text-align: left; border-bottom: 1px solid black; }
          </style>
        </head>
        <body>
          ${printContent}
          <script>
            window.onload = () => {
              window.print();
              window.close();
            };
          </script>
        </body>
      </html>
    `)
    printWindow.document.close()
  }

  const handleDownload = async () => {
    // We could use html2canvas + jspdf here if needed
    // For now, let's keep it simple with printing as PDF which is standard
    handlePrint()
  }

  const isRental = !!data.start_date

  return createPortal(
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(10px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999999, padding: '20px'
    }}>
      <div className="glass-card fade-in" style={{ 
        width: '100%', maxWidth: '400px', background: 'white', color: 'black', 
        padding: '0', position: 'relative', overflow: 'hidden', borderRadius: '8px'
      }}>
        {/* Modal Header Actions */}
        <div style={{ 
          background: '#f8f8f8', padding: '15px 20px', borderBottom: '1px solid #eee',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center'
        }}>
          <h3 style={{ margin: 0, fontSize: '1rem', color: '#333' }}>Comprobante de Pago</h3>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={handlePrint} className="btn-icon" title="Imprimir"><Printer size={20} color="#333" /></button>
            <button onClick={handleDownload} className="btn-icon" title="Descargar"><Download size={20} color="#333" /></button>
            <button onClick={onClose} className="btn-icon" title="Cerrar"><X size={20} color="#ef4444" /></button>
          </div>
        </div>

        {/* Receipt Preview Container (Scrollable) */}
        <div style={{ maxHeight: '70vh', overflowY: 'auto', padding: '20px', background: '#f0f0f0' }}>
          <div ref={receiptRef} style={{ 
            width: '80mm', margin: '0 auto', background: 'white', padding: '10mm', 
            boxShadow: '0 5px 15px rgba(0,0,0,0.1)', boxSizing: 'border-box',
            fontFamily: "'Courier New', Courier, monospace"
          }}>
            {/* Header */}
            <div className="center">
              <h2 style={{ margin: '0 0 5px 0', fontSize: '16px', fontWeight: 'bold', textTransform: 'uppercase' }}>
                {config?.company_name || 'URBAN LUXURY'}
              </h2>
              <p style={{ margin: '0', fontSize: '12px' }}>{config?.contact_address}</p>
              <p style={{ margin: '0', fontSize: '12px' }}>Tel: {config?.contact_phone}</p>
              <div style={{ margin: '10px 0', borderTop: '1px dashed black' }}></div>
            </div>

            {/* Transaction Info */}
            <div style={{ fontSize: '12px', marginBottom: '10px' }}>
              <p style={{ margin: '2px 0' }}><span className="bold">Factura:</span> #{data.id || 'N/A'}</p>
              <p style={{ margin: '2px 0' }}><span className="bold">Fecha:</span> {formatDate(data.created_at || new Date())}</p>
              <p style={{ margin: '2px 0' }}><span className="bold">Cliente:</span> {data.customer_name}</p>
              <p style={{ margin: '2px 0' }}><span className="bold">Atendido por:</span> {staffName || data.staff_name || 'Admin'}</p>
              <p style={{ margin: '2px 0', textTransform: 'uppercase' }}>
                <span className="bold">Método de Pago:</span> {data.payment_method || 'N/A'}
                {data.bank && ` (${data.bank})`}
              </p>
              {isRental && (
                <>
                  <p style={{ margin: '2px 0' }}><span className="bold">Recogida:</span> {formatDate(data.start_date)}</p>
                  <p style={{ margin: '2px 0' }}><span className="bold">Devolución:</span> {formatDate(data.end_date)}</p>
                </>
              )}
            </div>

            <div style={{ borderTop: '1px dashed black', margin: '10px 0' }}></div>

            {data.description && (
              <>
                <div style={{ fontSize: '11px', marginBottom: '10px' }}>
                  <p className="bold" style={{ margin: '0 0 2px 0' }}>OBSERVACIONES:</p>
                  <p style={{ margin: '0' }}>{data.description}</p>
                </div>
                <div style={{ borderTop: '1px dashed black', margin: '10px 0' }}></div>
              </>
            )}

            {/* Items Table */}
            <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', paddingBottom: '5px' }}>Item</th>
                  <th style={{ textAlign: 'right', paddingBottom: '5px' }}>Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {(data.items || []).map((item, idx) => (
                  <tr key={idx}>
                    <td style={{ padding: '4px 0' }}>
                      {item.product_name} <br/>
                      <span style={{ fontSize: '10px' }}>1 x {formatCurrency(item.price_at_sale || item.price_at_rental || 0)}</span>
                    </td>
                    <td style={{ textAlign: 'right', verticalAlign: 'top', padding: '4px 0' }}>
                      {formatCurrency(item.price_at_sale || item.price_at_rental || 0)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={{ borderTop: '1px dashed black', margin: '10px 0' }}></div>

            {/* Totals */}
            <div style={{ fontSize: '13px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span>TOTAL:</span>
                <span className="bold">{formatCurrency(data.total)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span>PAGADO:</span>
                <span>{formatCurrency(data.total_paid || data.total)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: data.balance > 0 ? 'red' : 'black' }}>
                <span className="bold">SALDO PENDIENTE:</span>
                <span className="bold">{formatCurrency(data.balance || 0)}</span>
              </div>
            </div>

            {/* Rental specific info */}
            {isRental && (
              <>
                <div style={{ borderTop: '1px dashed black', margin: '10px 0' }}></div>
                <div style={{ fontSize: '11px' }}>
                  <p style={{ margin: '2px 0' }}><span className="bold">Garantía:</span> {data.guarantee_type}</p>
                  {data.guarantee_info && <p style={{ margin: '2px 0' }}>{data.guarantee_info}</p>}
                </div>
              </>
            )}

            {/* Log of changes */}
            {data.logs && data.logs.length > 0 && (
              <>
                <div style={{ borderTop: '1px dashed black', margin: '10px 0' }}></div>
                <p className="bold" style={{ fontSize: '11px', marginBottom: '5px' }}>MOVIMIENTOS / CAMBIOS:</p>
                {data.logs.map((log, idx) => (
                  <div key={idx} style={{ fontSize: '9px', marginBottom: '5px', padding: '5px', background: '#f9f9f9' }}>
                    <p style={{ margin: 0 }}>{formatDate(log.created_at)} - {log.user_name}</p>
                    <p style={{ margin: 0, fontStyle: 'italic' }}>{log.action}: {formatCurrency(log.amount || 0)}</p>
                  </div>
                ))}
              </>
            )}

            <div style={{ borderTop: '1px dashed black', margin: '15px 0' }}></div>

            <div className="center" style={{ fontSize: '10px' }}>
              <p style={{ margin: '2px 0' }}>¡Gracias por su preferencia!</p>
              <p style={{ margin: '2px 0' }}>Conserve este comprobante.</p>
              <p style={{ margin: '10px 0 0 0', fontWeight: 'bold' }}>{config?.company_name || 'URBAN LUXURY'}</p>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div style={{ padding: '20px', display: 'flex', gap: '15px' }}>
          <button onClick={handlePrint} className="btn-primary" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
            <Printer size={18} /> IMPRIMIR FACTURA
          </button>
          <button onClick={onClose} className="btn-outline" style={{ flex: 1 }}>CERRAR</button>
        </div>
      </div>

      <style>{`
        .btn-icon {
          background: transparent;
          border: none;
          cursor: pointer;
          padding: 5px;
          border-radius: 4px;
          transition: background 0.2s;
        }
        .btn-icon:hover {
          background: rgba(0,0,0,0.05);
        }
        @media print {
          body * { visibility: hidden; }
          #receipt-to-print, #receipt-to-print * { visibility: visible; }
          #receipt-to-print { position: absolute; left: 0; top: 0; }
        }
      `}</style>
    </div>,
    document.body
  )
}

export default POSReceipt
