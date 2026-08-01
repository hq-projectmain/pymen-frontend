import { useEffect, useState } from 'react'
import { arcaService, type ArcaInvoiceContext, type ArcaInvoiceResult, type CreateArcaInvoice } from '../../../services/arcaService'
import { Modal } from '../../ui/Modal'
import { Input } from '../../ui/Input'
import { C, T } from '../../../styles/theme'

interface InvoiceModalProps {
  saleId: string
  totalPrice: number
  onClose: () => void
  onIssued: (result: ArcaInvoiceResult) => void
}

type VoucherType = 1 | 6 | 11
type Concept = 1 | 2 | 3
type VatRate = 0 | 10.5 | 21

const fieldStyle = {
  width: '100%',
  background: C.black,
  border: `1px solid ${C.border}`,
  borderRadius: 8,
  padding: '10px 14px',
  color: C.white,
  fontSize: 14,
  boxSizing: 'border-box' as const,
}

const roundMoney = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100
const arcaDate = (value: string) => value.replace(/-/g, '')

export function InvoiceModal({ saleId, totalPrice, onClose, onIssued }: InvoiceModalProps) {
  const [context, setContext] = useState<ArcaInvoiceContext | null>(null)
  const [voucherType, setVoucherType] = useState<VoucherType>(11)
  const [concept, setConcept] = useState<Concept>(1)
  const [documentType, setDocumentType] = useState(99)
  const [documentNumber, setDocumentNumber] = useState('0')
  const [vatCondition, setVatCondition] = useState(5)
  const [vatRate, setVatRate] = useState<VatRate>(21)
  const [serviceFrom, setServiceFrom] = useState('')
  const [serviceTo, setServiceTo] = useState('')
  const [paymentDueDate, setPaymentDueDate] = useState('')
  const [productionConfirmation, setProductionConfirmation] = useState('')
  const [loadingConfig, setLoadingConfig] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    arcaService.getInvoiceContext()
      .then(value => { if (active) setContext(value) })
      .catch(cause => { if (active) setError(cause instanceof Error ? cause.message : 'No se pudo cargar la configuración ARCA') })
      .finally(() => { if (active) setLoadingConfig(false) })
    return () => { active = false }
  }, [])

  function changeVoucherType(value: VoucherType) {
    setVoucherType(value)
    if (value === 1) {
      setDocumentType(80)
      setDocumentNumber('')
      setVatCondition(1)
      setVatRate(21)
    } else {
      setDocumentType(99)
      setDocumentNumber('0')
      setVatCondition(5)
      setVatRate(21)
    }
  }

  function buildPayload(): CreateArcaInvoice {
    const payload: CreateArcaInvoice = {
      voucherType,
      concept,
      receiverDocumentType: documentType,
      receiverDocumentNumber: documentNumber,
      receiverVatConditionId: vatCondition,
      currency: 'PES',
      exchangeRate: 1,
    }

    if (concept !== 1) {
      payload.serviceFrom = arcaDate(serviceFrom)
      payload.serviceTo = arcaDate(serviceTo)
      payload.paymentDueDate = arcaDate(paymentDueDate)
    }

    if (voucherType !== 11) {
      if (vatRate === 0) {
        payload.exemptAmount = roundMoney(totalPrice)
      } else {
        const baseAmount = roundMoney(totalPrice / (1 + vatRate / 100))
        payload.vat = [{
          id: vatRate === 21 ? 5 : 4,
          baseAmount,
          amount: roundMoney(totalPrice - baseAmount),
        }]
      }
    }

    return payload
  }

  async function handleSubmit() {
    if (!context) return
    if (!context.configured || !context.canInvoice) {
      setError(context.message || 'La facturación ARCA no está lista para este comercio')
      return
    }
    if (!/^\d{1,11}$/.test(documentNumber)) {
      setError('El documento debe contener solamente números')
      return
    }
    if (voucherType === 1 && (documentType !== 80 || documentNumber.length !== 11)) {
      setError('La Factura A requiere un CUIT válido de 11 dígitos')
      return
    }
    if (concept !== 1 && (!serviceFrom || !serviceTo || !paymentDueDate)) {
      setError('Los comprobantes de servicios requieren período y fecha de vencimiento de pago')
      return
    }
    if (context.environment === 'production' && productionConfirmation !== 'EMITIR') {
      setError('Escribí EMITIR para confirmar una factura real de producción')
      return
    }

    const environmentLabel = context.environment === 'production' ? 'PRODUCCIÓN' : 'HOMOLOGACIÓN'
    if (!window.confirm(`Se solicitará un CAE en ${environmentLabel}. ¿Confirmás la emisión?`)) return

    try {
      setSubmitting(true)
      setError('')
      const result = await arcaService.createInvoice(saleId, buildPayload())
      onIssued(result)
      onClose()
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : 'No se pudo emitir el comprobante')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal title="Emitir comprobante ARCA" onClose={onClose}>
      {loadingConfig ? <p style={{ color: C.lime }}>Validando configuración...</p> : (
        <>
          {context && (
            <div style={{ padding: 12, borderRadius: 8, marginBottom: 16, background: context.environment === 'production' ? 'rgba(255,59,48,.12)' : 'rgba(204,255,0,.08)', color: context.environment === 'production' ? C.red : C.lime, fontSize: 13, fontWeight: 700 }}>
              {context.environment === 'production' ? 'PRODUCCIÓN · comprobante fiscal real' : 'HOMOLOGACIÓN · comprobante de prueba'} · PV {context.puntoVenta ?? '—'}
            </div>
          )}

          {context && (!context.configured || !context.canInvoice) ? (
            <p role="alert" style={{ color: C.red, fontSize: 13 }}>{context.message || 'La facturación ARCA no está lista para este comercio.'}</p>
          ) : null}

          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, color: C.gray, display: 'block', marginBottom: 6 }}>TIPO DE COMPROBANTE</label>
            <select style={fieldStyle} value={voucherType} onChange={event => changeVoucherType(Number(event.target.value) as VoucherType)}>
              <option value={11}>Factura C</option>
              <option value={6}>Factura B</option>
              <option value={1}>Factura A</option>
            </select>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, color: C.gray, display: 'block', marginBottom: 6 }}>CONCEPTO</label>
            <select style={fieldStyle} value={concept} onChange={event => setConcept(Number(event.target.value) as Concept)}>
              <option value={1}>Productos</option>
              <option value={2}>Servicios</option>
              <option value={3}>Productos y servicios</option>
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, color: C.gray, display: 'block', marginBottom: 6 }}>TIPO DE DOCUMENTO</label>
              <select style={fieldStyle} value={documentType} onChange={event => setDocumentType(Number(event.target.value))}>
                <option value={99}>Consumidor final</option>
                <option value={96}>DNI</option>
                <option value={80}>CUIT</option>
              </select>
            </div>
            <Input label="Documento" inputMode="numeric" maxLength={11} value={documentNumber} onChange={event => setDocumentNumber(event.target.value.replace(/\D/g, ''))} />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, color: C.gray, display: 'block', marginBottom: 6 }}>CONDICIÓN IVA DEL RECEPTOR</label>
            <select style={fieldStyle} value={vatCondition} onChange={event => setVatCondition(Number(event.target.value))}>
              <option value={1}>Responsable inscripto</option>
              <option value={4}>Exento</option>
              <option value={5}>Consumidor final</option>
              <option value={6}>Monotributo</option>
            </select>
          </div>

          {voucherType !== 11 && (
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, color: C.gray, display: 'block', marginBottom: 6 }}>TRATAMIENTO DE IVA</label>
              <select style={fieldStyle} value={vatRate} onChange={event => setVatRate(Number(event.target.value) as VatRate)}>
                <option value={21}>IVA 21% incluido en el total</option>
                <option value={10.5}>IVA 10,5% incluido en el total</option>
                <option value={0}>Operación exenta</option>
              </select>
              <p style={{ ...T.pageSub, lineHeight: 1.5 }}>Esta primera interfaz admite una tasa de IVA por venta. El backend ya soporta múltiples alícuotas.</p>
            </div>
          )}

          {concept !== 1 && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <Input label="Servicio desde" type="date" value={serviceFrom} onChange={event => setServiceFrom(event.target.value)} />
              <Input label="Servicio hasta" type="date" value={serviceTo} onChange={event => setServiceTo(event.target.value)} />
              <Input label="Vencimiento de pago" type="date" value={paymentDueDate} onChange={event => setPaymentDueDate(event.target.value)} />
            </div>
          )}

          <div style={{ padding: 12, background: C.black, borderRadius: 8, marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: C.gray }}>Total de la venta</span>
            <strong style={{ color: C.white }}>${Number(totalPrice).toLocaleString('es-AR')}</strong>
          </div>

          {context?.environment === 'production' && (
            <Input label="Escribí EMITIR para confirmar" value={productionConfirmation} onChange={event => setProductionConfirmation(event.target.value)} />
          )}

          {error && <p role="alert" style={{ color: C.red, fontSize: 13 }}>{error}</p>}

          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            <button style={{ ...T.btnPrimary, flex: 1 }} disabled={!context?.configured || !context.canInvoice || submitting} onClick={handleSubmit}>
              {submitting ? 'Solicitando CAE...' : 'Emitir en ARCA'}
            </button>
            <button style={T.btnGhost} disabled={submitting} onClick={onClose}>Cancelar</button>
          </div>
        </>
      )}
    </Modal>
  )
}
