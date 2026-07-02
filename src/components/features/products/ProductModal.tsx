import { useState } from 'react'
import { Modal, Input } from '../../ui'
import { useBusinessContext } from '../../../context/BusinessContext'
import { T } from '../../../styles/theme'
import { Product } from '../../../types'

interface ProductModalProps {
  editTarget: Product | null
  onClose: () => void
}

export function ProductModal({ editTarget, onClose }: ProductModalProps) {
  const { addProduct, editProduct } = useBusinessContext()

  const [form, setForm] = useState({
    name:  editTarget?.name          ?? '',
    desc:  editTarget?.desc          ?? '',
    price: editTarget?.price?.toString() ?? '',
    stock: editTarget?.stock?.toString() ?? '',
  })

  const upd = (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }))

  const handleSave = () => {
    if (!form.name || !form.price) return
    const data = {
      name:  form.name,
      desc:  form.desc,
      price: Number(form.price),
      stock: Number(form.stock),
    }
    editTarget ? editProduct(editTarget.id, data) : addProduct(data)
    onClose()
  }

  return (
    <Modal
      title={editTarget ? 'Editar producto' : 'Nuevo producto'}
      onClose={onClose}
    >
      <Input label="Nombre"       placeholder="Ej: Taladro"         value={form.name}  onChange={upd('name')}  />
      <Input label="Descripción"  placeholder="Descripción breve"   value={form.desc}  onChange={upd('desc')}  />
      <Input label="Precio ($)"   type="number" placeholder="0"     value={form.price} onChange={upd('price')} />
      <Input label="Stock"        type="number" placeholder="0"     value={form.stock} onChange={upd('stock')} />

      <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
        <button
          style={{ ...T.btnRed, flex: 1, padding: '12px 18px' }}
          onClick={handleSave}
        >
          {editTarget ? 'Guardar cambios' : 'Crear producto'}
        </button>
        <button style={{ ...T.btnGhost, padding: '12px 16px' }} onClick={onClose}>
          Cancelar
        </button>
      </div>
    </Modal>
  )
}
