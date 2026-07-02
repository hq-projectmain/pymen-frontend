import { useEffect, useState } from 'react';
import { productService, type Product, type CreateProductData } from '../../../services/productService';
import { Modal } from '../../ui/Modal';
import { Input } from '../../ui/Input';
import { C, T } from '../../../styles/theme';

const EMPTY_FORM: CreateProductData = { name: '', description: '', price: 0, stock: 0 };

interface EditForm { name: string; price: number; stock: number }

export default function ProductsListView() {
    const [products, setProducts]       = useState<Product[]>([]);
    const [loading, setLoading]         = useState(true);
    const [error, setError]             = useState('');

    //crear
    const [showCreate, setShowCreate]   = useState(false);
    const [form, setForm]               = useState<CreateProductData>(EMPTY_FORM);
    const [saving, setSaving]           = useState(false);
    const [saveError, setSaveError]     = useState('');

    //editar
    const [editProduct, setEditProduct] = useState<Product | null>(null);
    const [editForm, setEditForm]       = useState<EditForm>({ name: '', price: 0, stock: 0 });
    const [editSaving, setEditSaving]   = useState(false);
    const [editError, setEditError]     = useState('');

    //activar / desactivar
    const [togglingId, setTogglingId] = useState<string | null>(null);

    async function fetchProducts() {
        try {
            setLoading(true);
            setError('');
            const data = await productService.getProducts();
            setProducts(data);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Error al conectar con el servidor';
            setError(message);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => { fetchProducts(); }, []);

    const upd = (k: keyof CreateProductData) =>
        (e: React.ChangeEvent<HTMLInputElement>) =>
            setForm(f => ({ ...f, [k]: k === 'name' || k === 'description' ? e.target.value : Number(e.target.value) }));

    async function handleCreate() {
        if (!form.name || !form.price) return;
        try {
            setSaving(true);
            setSaveError('');
            await productService.createProduct(form);
            setShowCreate(false);
            setForm(EMPTY_FORM);
            await fetchProducts();
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Error al crear el producto';
            setSaveError(message);
        } finally {
            setSaving(false);
        }
    }

    function openEdit(p: Product) {
        setEditProduct(p);
        setEditForm({ name: p.name, price: p.price, stock: p.stock });
        setEditError('');
    }

    const updEdit = (k: keyof EditForm) =>
        (e: React.ChangeEvent<HTMLInputElement>) =>
            setEditForm(f => ({ ...f, [k]: k === 'name' ? e.target.value : Number(e.target.value) }));

    async function handleEdit() {
        if (!editProduct) return;
        try {
            setEditSaving(true);
            setEditError('');
            await productService.updateProduct(editProduct.id, editForm);
            setEditProduct(null);
            await fetchProducts();
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Error al actualizar el producto';
            setEditError(message);
        } finally {
            setEditSaving(false);
        }
    }

    async function handleToggleActive(p: Product) {
        const action = p.isActive ? 'desactivar' : 'activar';
        if (!window.confirm(`¿${action.charAt(0).toUpperCase() + action.slice(1)} "${p.name}"?`)) return;
        try {
            setTogglingId(p.id);
            await productService.updateProduct(p.id, { isActive: !p.isActive });
            await fetchProducts();
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : `Error al ${action} el producto`;
            alert(message);
        } finally {
            setTogglingId(null);
        }
    }

    const btnAction: React.CSSProperties = {
        background: 'transparent',
        border: `1px solid ${C.border}`,
        color: C.gray,
        borderRadius: 6,
        padding: '4px 10px',
        fontSize: 11,
        fontWeight: 600,
        cursor: 'pointer',
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <div>
                    <div style={T.pageHead}>Productos</div>
                    <div style={T.pageSub}>{products.length} productos cargados</div>
                </div>
                <button style={T.btnPrimary} onClick={() => { setForm(EMPTY_FORM); setSaveError(''); setShowCreate(true); }}>
                    + Nuevo producto
                </button>
            </div>

            {loading && <p style={{ color: C.lime, marginTop: 20 }}>Cargando productos...</p>}
            {error   && <p style={{ color: C.red,  marginTop: 20 }}>{error}</p>}

            {!loading && !error && products.length === 0 && (
                <p style={{ ...T.pageSub, marginTop: 20 }}>Aún no tenés productos cargados.</p>
            )}

            {!loading && !error && products.length > 0 && (
                <div style={T.card}>
                    <table style={T.table}>
                        <thead>
                        <tr>
                            {['Nombre', 'Descripción', 'Precio', 'Stock', 'Estado', 'Acciones'].map(h => (
                                <th key={h} style={T.th}>{h}</th>
                            ))}
                        </tr>
                        </thead>
                        <tbody>
                        {products.map(p => (
                            <tr key={p.id}>
                                <td style={T.tdW}>{p.name}</td>
                                <td style={T.td}>{p.description}</td>
                                <td style={{ ...T.td, color: '#E5E5E5', fontWeight: 600 }}>
                                    ${Number(p.price).toLocaleString('es-AR')}
                                </td>
                                <td style={{ ...T.td, color: p.stock === 0 ? C.red : C.white, fontWeight: p.stock === 0 ? 700 : 400 }}>
                                    {p.stock}
                                </td>
                                <td style={T.td}>
                    <span style={btnAction}>
                      {p.isActive ? 'Activo' : 'Inactivo'}
                    </span>
                                </td>
                                <td style={T.td}>
                                    <div style={{ display: 'flex', gap: 6 }}>
                                        <button style={btnAction} onClick={() => openEdit(p)}>
                                            Editar
                                        </button>
                                        <button
                                            style={btnAction}
                                            onClick={() => handleToggleActive(p)}
                                            disabled={togglingId === p.id}
                                        >
                                            {togglingId === p.id ? '...' : p.isActive ? 'Desactivar' : 'Activar'}
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            )}

            {showCreate && (
                <Modal title="Nuevo producto" onClose={() => setShowCreate(false)}>
                    <Input label="Nombre"      placeholder="Ej: Taladro"       value={form.name}        onChange={upd('name')}        />
                    <Input label="Descripción" placeholder="Descripción breve" value={form.description}  onChange={upd('description')} />
                    <Input label="Precio ($)"  type="number" placeholder="0"   value={form.price || ''}  onChange={upd('price')}       />
                    <Input label="Stock"       type="number" placeholder="0"   value={form.stock || ''}  onChange={upd('stock')}       />

                    {saveError && <p style={{ color: C.red, fontSize: 13, marginBottom: 12 }}>{saveError}</p>}

                    <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                        <button style={{ ...T.btnPrimary, flex: 1, padding: '12px 18px' }} onClick={handleCreate} disabled={saving}>
                            {saving ? 'Guardando...' : 'Crear producto'}
                        </button>
                        <button style={{ ...T.btnGhost, padding: '12px 16px' }} onClick={() => setShowCreate(false)}>Cancelar</button>
                    </div>
                </Modal>
            )}

            {editProduct && (
                <Modal title={`Editar · ${editProduct.name}`} onClose={() => setEditProduct(null)}>
                    <Input label="Nombre"     value={editForm.name}            onChange={updEdit('name')}  />
                    <Input label="Precio ($)" type="number" value={editForm.price || ''} onChange={updEdit('price')} />
                    <Input label="Stock"      type="number" value={editForm.stock || ''} onChange={updEdit('stock')} />

                    {editError && <p style={{ color: C.red, fontSize: 13, marginBottom: 12 }}>{editError}</p>}

                    <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                        <button style={{ ...T.btnPrimary, flex: 1, padding: '12px 18px' }} onClick={handleEdit} disabled={editSaving}>
                            {editSaving ? 'Guardando...' : 'Guardar cambios'}
                        </button>
                        <button style={{ ...T.btnGhost, padding: '12px 16px' }} onClick={() => setEditProduct(null)}>Cancelar</button>
                    </div>
                </Modal>
            )}
        </div>
    );
}
