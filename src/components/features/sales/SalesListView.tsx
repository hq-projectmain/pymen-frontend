import { useEffect, useState } from 'react';
import { saleService, type Sale, type CreateSaleItem } from '../../../services/saleService'; // 👈 import type
import { productService, type Product } from '../../../services/productService'; // 👈 import type
import { Modal } from '../../ui/Modal';
import { C, T } from '../../../styles/theme';

const fmtMoney = (n: number) => `$${Number(n).toLocaleString('es-AR')}`;
const fmtDate  = (d: string) => new Date(d).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' });

// ── Detalle de venta (Modificado con soporte ARCA) ──────────────────────────

function SaleDetail({ sale, onBack, onRefresh }: { sale: Sale; onBack: () => void; onRefresh: () => void }) {
    const [localSale, setLocalSale] = useState<Sale>(sale);
    const [loadingInvoice, setLoadingInvoice] = useState(false);
    const [loadingPdf, setLoadingPdf] = useState(false);

    // Formateador simple para la fecha de vencimiento AAAAMMDD -> DD/MM/AAAA
    const fmtCaeExpiry = (dateStr?: string) => {
        if (!dateStr || dateStr.length !== 8) return dateStr || '—';
        return `${dateStr.slice(6, 8)}/${dateStr.slice(4, 6)}/${dateStr.slice(0, 4)}`;
    };

    // 1. Manejo de emisión de factura
    async function handleGenerateInvoice() {
        if (!window.confirm('¿Estás seguro de que querés emitir la factura oficial en ARCA/AFIP para esta venta?')) return;
        try {
            setLoadingInvoice(true);
            const data = await saleService.generateInvoice(localSale.id);
            alert(data.message);

            // Actualizamos la vista local con los datos devueltos
            const updated = {
                ...localSale,
                cae: data.cae,
                caeExpiration: data.caeExpiration,
                voucherNumber: data.voucherNumber
            };
            setLocalSale(updated);
            
            // Refrescamos la lista del componente padre de fondo
            onRefresh();
        } catch (err: any) {
            alert(err.message || 'Ocurrió un error al procesar la factura');
        } finally {
            setLoadingInvoice(false);
        }
    }

    // 2. Descarga e inyección del HTML en pestaña nueva ("El Tip Seguro")
    async function handlePrintInvoice() {
        try {
            setLoadingPdf(true);
            const htmlContent = await saleService.getInvoicePdfHtml(localSale.id);

            // Abrimos una nueva pestaña vacía en el navegador
            const printWindow = window.open('', '_blank');
            if (printWindow) {
                printWindow.document.open();
                // Inyectamos el HTML nativo que trajo el backend con sus estilos y scripts auto-ejecutables
                printWindow.document.write(htmlContent);
                printWindow.document.close();
            } else {
                alert('El navegador bloqueó la ventana emergente. Por favor, habilitá los pop-ups para este sitio.');
            }
        } catch (err: any) {
            alert(err.message || 'No se pudo generar la vista de impresión');
        } finally {
            setLoadingPdf(false);
        }
    }

    return (
        <>
            {/* Cabecera del Detalle */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <button style={T.btnGhost} onClick={onBack}>← Volver</button>
                    <div>
                        <div style={T.pageHead}>Detalle · {localSale.id.slice(0, 8)}…</div>
                        <div style={T.pageSub}>{fmtDate(localSale.createdAt)}</div>
                    </div>
                </div>

                {/* Botonera dinámica según estado del CAE */}
                <div style={{ display: 'flex', gap: 10 }}>
                    {!localSale.cae ? (
                        <button 
                            style={{ ...T.btnPrimary, background: '#1D9E75' }} 
                            onClick={handleGenerateInvoice}
                            disabled={loadingInvoice}
                        >
                            {loadingInvoice ? 'Emitiendo CAE...' : '⚡ Generar Factura'}
                        </button>
                    ) : (
                        <button 
                            style={{ ...T.btnLime, borderColor: C.lime }} 
                            onClick={handlePrintInvoice}
                            disabled={loadingPdf}
                        >
                            {loadingPdf ? 'Cargando comprobante...' : '🖨️ Imprimir Factura'}
                        </button>
                    )}
                </div>
            </div>

            {/* Tarjeta de información fiscal (Solo si ya fue emitida) */}
            {localSale.cae && (
                <div style={{ ...T.card, marginBottom: 20, borderColor: C.borderLime, background: 'rgba(204,255,0,0.02)' }}>
                    <div style={{ ...T.sectionTitle, color: C.lime, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                        <span>✓ Factura Autorizada por ARCA</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                        <div>
                            <span style={{ fontSize: 11, color: C.gray, display: 'block', textTransform: 'uppercase' }}>N° Factura</span>
                            <span style={{ fontSize: 15, color: C.white, fontWeight: 600 }}>{String(localSale.voucherNumber).padStart(8, '0')}</span>
                        </div>
                        <div>
                            <span style={{ fontSize: 11, color: C.gray, display: 'block', textTransform: 'uppercase' }}>CAE</span>
                            <span style={{ fontSize: 15, color: C.white, fontWeight: 600, letterSpacing: 0.5 }}>{localSale.cae}</span>
                        </div>
                        <div>
                            <span style={{ fontSize: 11, color: C.gray, display: 'block', textTransform: 'uppercase' }}>Vto. CAE</span>
                            <span style={{ fontSize: 15, color: C.white, fontWeight: 600 }}>{fmtCaeExpiry(localSale.caeExpiration)}</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Tabla de ítems de la venta */}
            <div style={T.card}>
                <table style={T.table}>
                    <thead>
                        <tr>
                            {['Producto', 'Precio unitario', 'Cantidad', 'Subtotal'].map(h => (
                                <th key={h} style={T.th}>{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {localSale.items.map(it => (
                            <tr key={it.id}>
                                <td style={T.tdW}>{it.product?.name ?? '—'}</td>
                                <td style={T.td}>{fmtMoney(it.priceAtSale)}</td>
                                <td style={T.td}>{it.quantity}</td>
                                <td style={{ ...T.td, color: C.lime, fontWeight: 600 }}>
                                    {fmtMoney(it.priceAtSale * it.quantity)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                <div style={{ borderTop: `1px solid ${C.border}`, marginTop: 8, paddingTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 12, color: C.gray, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Total</div>
                        <div style={{ fontSize: 28, fontWeight: 900, color: C.lime, letterSpacing: -1 }}>{fmtMoney(localSale.totalPrice)}</div>
                    </div>
                </div>
            </div>
        </>
    );
}

// ── Modal registrar venta ─────────────────────────────────────────────────────
interface SaleFormItem { productId: string; quantity: number }

function SaleFormModal({ products, onClose, onCreated }: {
    products: Product[];
    onClose: () => void;
    onCreated: () => void;
}) {
    const [items, setItems]     = useState<SaleFormItem[]>([{ productId: '', quantity: 1 }]);
    const [saving, setSaving]   = useState(false);
    const [error, setError]     = useState('');

    const activeProducts = products.filter(p => p.isActive);

    const updateItem = (i: number, field: keyof SaleFormItem, value: string) =>
        setItems(s => s.map((x, j) => j === i ? { ...x, [field]: field === 'quantity' ? Number(value) : value } : x));

    const removeItem = (i: number) => setItems(s => s.filter((_, j) => j !== i));

    const total = items.reduce((acc, it) => {
        const p = products.find(p => p.id === it.productId);
        return acc + (p ? p.price * it.quantity : 0);
    }, 0);

    async function handleSave() {
        if (items.some(it => !it.productId)) return;
        try {
            setSaving(true);
            setError('');
            const payload: CreateSaleItem[] = items.map(it => ({ product_id: it.productId, quantity: it.quantity }));
            await saleService.createSale(payload, total);
            onCreated();
            onClose();
        } catch (err: unknown) { // 👈 Tipado estricto a unknown
            const message = err instanceof Error ? err.message : 'Error al registrar la venta';
            setError(message);
        } finally {
            setSaving(false);
        }
    }

    const inputStyle = {
        width: '100%', background: C.black, border: `1px solid ${C.border}`,
        borderRadius: 8, padding: '10px 14px', color: C.white, fontSize: 14,
        outline: 'none', boxSizing: 'border-box' as const,
    };

    return (
        <Modal title="Registrar venta" onClose={onClose}>
            <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: C.gray, marginBottom: 8, display: 'block', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                    Productos
                </label>

                {items.map((it, i) => (
                    <div key={i} style={{ display: 'grid', gridTemplateColumns: items.length > 1 ? '1fr 80px 32px' : '1fr 80px', gap: 8, marginBottom: 8 }}>
                        <select style={inputStyle} value={it.productId} onChange={e => updateItem(i, 'productId', e.target.value)}>
                            <option value="">Elegir producto…</option>
                            {activeProducts.map(p => (
                                <option key={p.id} value={p.id}>{p.name} — {fmtMoney(p.price)}</option>
                            ))}
                        </select>

                        <input
                            type="number" min="1" style={inputStyle}
                            value={it.quantity}
                            onChange={e => updateItem(i, 'quantity', e.target.value)}
                        />

                        {items.length > 1 && (
                            <button style={{ background: 'rgba(255,59,48,0.1)', color: C.red, border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 18, fontWeight: 700 }} onClick={() => removeItem(i)}>
                                ×
                            </button>
                        )}
                    </div>
                ))}

                <button style={{ ...T.btnGhost, fontSize: 12, marginTop: 4 }} onClick={() => setItems(s => [...s, { productId: '', quantity: 1 }])}>
                    + Agregar producto
                </button>
            </div>

            <div style={{ background: C.black, borderRadius: 8, padding: '10px 14px', marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13, color: C.gray }}>Total</span>
                <span style={{ fontSize: 18, fontWeight: 800, color: C.lime }}>{fmtMoney(total)}</span>
            </div>

            {error && <p style={{ color: C.red, fontSize: 13, marginBottom: 12 }}>{error}</p>}

            <div style={{ display: 'flex', gap: 10 }}>
                <button style={{ ...T.btnPrimary, flex: 1, padding: '12px 18px' }} onClick={handleSave} disabled={saving}>
                    {saving ? 'Registrando...' : 'Registrar venta'}
                </button>
                <button style={{ ...T.btnGhost, padding: '12px 16px' }} onClick={onClose}>Cancelar</button>
            </div>
        </Modal>
    );
}

// ── Vista principal ───────────────────────────────────────────────────────────
export default function SalesListView() {
    const [sales, setSales]         = useState<Sale[]>([]);
    const [products, setProducts]   = useState<Product[]>([]);
    const [loading, setLoading]     = useState(true);
    const [error, setError]         = useState('');
    const [selected, setSelected]   = useState<Sale | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [hovered, setHovered]     = useState<string | null>(null);

    async function fetchAll() {
        try {
            setLoading(true);
            setError('');
            const [salesData, productsData] = await Promise.all([
                saleService.getSales(),
                productService.getProducts(),
            ]);
            setSales(salesData);
            setProducts(productsData);
        } catch (err: unknown) { // 👈 Evitamos la filtración de any
            const message = err instanceof Error ? err.message : 'Error al conectar con el servidor';
            setError(message);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => { fetchAll(); }, []);

    if (selected) return <SaleDetail sale={selected} onBack={() => setSelected(null)} onRefresh={fetchAll} />;

    return (
        <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <div>
                    <div style={T.pageHead}>Ventas</div>
                    <div style={T.pageSub}>Hacé clic en una fila para ver el detalle</div>
                </div>
                <button style={T.btnPrimary} onClick={() => setShowModal(true)}>+ Registrar venta</button>
            </div>

            {loading && <p style={{ color: C.lime, marginTop: 20 }}>Cargando ventas...</p>}
            {error   && <p style={{ color: C.red,  marginTop: 20 }}>{error}</p>}

            {!loading && !error && sales.length === 0 && (
                <p style={{ ...T.pageSub, marginTop: 20 }}>Aún no hay ventas registradas.</p>
            )}

            {!loading && !error && sales.length > 0 && (
                <div style={T.card}>
                    <table style={T.table}>
                        <thead>
                        <tr>
                            {['ID Venta', 'Total', 'Fecha'].map(h => (
                                <th key={h} style={T.th}>{h}</th>
                            ))}
                        </tr>
                        </thead>
                        <tbody>
                        {[...sales].reverse().map(s => (
                            <tr
                                key={s.id}
                                style={{ background: hovered === s.id ? 'rgba(255,255,255,0.03)' : 'transparent', cursor: 'pointer', transition: 'background .1s' }}
                                onMouseEnter={() => setHovered(s.id)}
                                onMouseLeave={() => setHovered(null)}
                                onClick={() => setSelected(s)}
                            >
                                <td style={T.tdW}>{s.id.slice(0, 8)}…</td>
                                <td style={{ ...T.tdW, color: C.lime }}>{fmtMoney(s.totalPrice)}</td>
                                <td style={T.td}>{fmtDate(s.createdAt)}</td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            )}

            {showModal && (
                <SaleFormModal
                    products={products}
                    onClose={() => setShowModal(false)}
                    onCreated={fetchAll}
                />
            )}
        </>
    );
}
