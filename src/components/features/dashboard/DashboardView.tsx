import { useEffect, useState } from 'react';
import { productService, type Product } from '../../../services/productService';
import { saleService, type Sale } from '../../../services/saleService';
import { userService } from '../../../services/userService';
import { C, T } from '../../../styles/theme';

const fmtMoney = (n: number) => `$${Number(n).toLocaleString('es-AR')}`;
const fmtDate  = (d: string) => new Date(d).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' });

function saleProducts(sale: Sale): string {
    const names = sale.items.map(i => i.product?.name).filter(Boolean);
    if (names.length === 0) return '—';
    if (names.length === 1) return names[0]!;
    return `${names[0]} +${names.length - 1}`;
}

export default function DashboardView() {
    const [businessName, setBusinessName] = useState('');
    const [products, setProducts]         = useState<Product[]>([]);
    const [sales, setSales]               = useState<Sale[]>([]);
    const [loading, setLoading]           = useState(true);
    const [error, setError]               = useState('');

    useEffect(() => {
        async function fetchData() {
            try {
                setLoading(true);
                const [productsData, salesData, profile] = await Promise.all([
                    productService.getProducts(),
                    saleService.getSales(),
                    userService.getProfile(),
                ]);
                setProducts(productsData);
                setSales(salesData);
                setBusinessName(profile.name);
            } catch (err: unknown) { // 👈 Cambiado de 'any' a 'unknown' por seguridad
                const message = err instanceof Error ? err.message : 'Error al cargar el dashboard';
                setError(message);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, []);

    const totalRevenue   = sales.reduce((acc, s) => acc + Number(s.totalPrice), 0);
    const activeProducts = products.filter(p => p.isActive).length;
    const recentSales    = [...sales].slice(0, 5);

    if (loading) return <p style={{ color: C.lime, marginTop: 20 }}>Cargando dashboard...</p>;
    if (error)   return <p style={{ color: C.red,  marginTop: 20 }}>{error}</p>;

    return (
        <>
            <div style={{ marginBottom: 20 }}>
                <div style={T.pageHead}>{businessName}</div>
                <div style={{ ...T.pageSub, marginBottom: 0 }}>Panel de tu comercio</div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
                {[
                    { label: 'Productos',   val: products.length,        sub: `${activeProducts} activos` },
                    { label: 'Ventas',      val: sales.length,           sub: 'registradas'               },
                    { label: 'Facturación', val: fmtMoney(totalRevenue), sub: 'total'                     },
                ].map(s => (
                    <div key={s.label} style={T.statCard}>
                        <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: C.gray, marginBottom: 8 }}>
                            {s.label}
                        </div>
                        <div style={{ fontSize: 34, fontWeight: 900, letterSpacing: -2, color: C.white }}>
                            {s.val}
                        </div>
                        <div style={{ fontSize: 12, color: C.lime, marginTop: 4, fontWeight: 600 }}>
                            {s.sub}
                        </div>
                    </div>
                ))}
            </div>

            <div style={T.card}>
                <div style={T.sectionTitle}>Ventas recientes</div>
                {recentSales.length === 0 ? (
                    <p style={{ ...T.pageSub, padding: '8px 0' }}>Aún no hay ventas registradas.</p>
                ) : (
                    <table style={T.table}>
                        <thead>
                        <tr>
                            {['ID', 'Producto', 'Total', 'Fecha'].map(h => (
                                <th key={h} style={T.th}>{h}</th>
                            ))}
                        </tr>
                        </thead>
                        <tbody>
                        {recentSales.map(s => (
                            <tr key={s.id}>
                                <td style={T.tdW}>{s.id.slice(0, 8)}…</td>
                                <td style={T.td}>{saleProducts(s)}</td>
                                <td style={{ ...T.tdW, color: '#E5E5E5' }}>{fmtMoney(s.totalPrice)}</td>
                                <td style={T.td}>{fmtDate(s.createdAt)}</td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                )}
            </div>
        </>
    );
}
