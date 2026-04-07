import { ImagePlus, Save, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { formatCurrency, getProducts, supabase } from '../lib/supabase';

const emptyProduct = {
  name: '',
  price: '',
  category: 'Ring',
  image_url: '',
  description: '',
  stock: 1,
};

export default function Admin() {
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [form, setForm] = useState(emptyProduct);
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    refresh();
  }, []);

  async function refresh() {
    try {
      const productData = await getProducts();
      setProducts(productData);

      const { data: orderData, error } = await supabase
        .from('orders')
        .select('*, order_items(*, products(name))')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setOrders(orderData || []);
    } catch (error) {
      setMessage(error.message);
    }
  }

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function uploadImage(file) {
    if (!file) return;
    const path = `${crypto.randomUUID()}-${file.name}`;
    setMessage('Uploading image...');
    const { error } = await supabase.storage.from('product-images').upload(path, file, { upsert: true });
    if (error) throw error;
    const { data } = supabase.storage.from('product-images').getPublicUrl(path);
    update('image_url', data.publicUrl);
    setMessage('Image uploaded.');
  }

  async function saveProduct(event) {
    event.preventDefault();
    try {
      const payload = {
        ...form,
        price: Number(form.price),
        stock: Number(form.stock),
      };

      const query = editingId
        ? supabase.from('products').update(payload).eq('id', editingId)
        : supabase.from('products').insert(payload);

      const { error } = await query;
      if (error) throw error;
      setForm(emptyProduct);
      setEditingId(null);
      setMessage('Product saved.');
      await refresh();
    } catch (error) {
      setMessage(error.message);
    }
  }

  function editProduct(product) {
    setEditingId(product.id);
    setForm({
      name: product.name || '',
      price: product.price || '',
      category: product.category || 'Ring',
      image_url: product.image_url || '',
      description: product.description || '',
      stock: product.stock ?? 1,
    });
  }

  async function deleteProduct(id) {
    try {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
      setMessage('Product deleted.');
      await refresh();
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function updateOrderStatus(id, status) {
    try {
      const { error } = await supabase.from('orders').update({ status }).eq('id', id);
      if (error) throw error;
      await refresh();
    } catch (error) {
      setMessage(error.message);
    }
  }

  return (
    <section className="page admin-layout">
      <div className="admin-hero">
        <p className="eyebrow">Admin</p>
        <h1>Manage Paskal Diamonds.</h1>
        {message && <p className="status-note">{message}</p>}
      </div>

      <form className="admin-card form-grid" onSubmit={saveProduct}>
        <h2>{editingId ? 'Edit product' : 'Add product'}</h2>
        <label>Name<input value={form.name} onChange={(event) => update('name', event.target.value)} required /></label>
        <label>Price<input type="number" value={form.price} onChange={(event) => update('price', event.target.value)} required /></label>
        <label>Category<input value={form.category} onChange={(event) => update('category', event.target.value)} required /></label>
        <label>Stock<input type="number" value={form.stock} onChange={(event) => update('stock', event.target.value)} required /></label>
        <label>Description<textarea value={form.description} onChange={(event) => update('description', event.target.value)} /></label>
        <label>Image URL<input value={form.image_url} onChange={(event) => update('image_url', event.target.value)} /></label>
        <label className="upload-box">
          <ImagePlus /> Upload image
          <input type="file" accept="image/*" onChange={(event) => uploadImage(event.target.files?.[0])} />
        </label>
        {form.image_url && <img className="preview-image" src={form.image_url} alt="Product preview" />}
        <button className="button primary full" type="submit"><Save size={18} /> Save product</button>
      </form>

      <div className="admin-card">
        <h2>Products</h2>
        <div className="admin-list">
          {products.map((product) => (
            <article key={product.id} className="admin-row">
              <img src={product.image_url} alt={product.name} />
              <div>
                <h3>{product.name}</h3>
                <p>{product.category} · {formatCurrency(product.price)} · Stock {product.stock}</p>
              </div>
              <button onClick={() => editProduct(product)}>Edit</button>
              <button className="icon-button danger" onClick={() => deleteProduct(product.id)} aria-label={`Delete ${product.name}`}><Trash2 /></button>
            </article>
          ))}
        </div>
      </div>

      <div className="admin-card">
        <h2>Orders</h2>
        <div className="admin-list">
          {orders.map((order) => (
            <article className="order-row" key={order.id}>
              <div>
                <h3>{formatCurrency(order.total_price)} · {order.payment_method}</h3>
                <p>{new Date(order.created_at).toLocaleString()} · {order.order_items?.length || 0} items</p>
              </div>
              <select value={order.status} onChange={(event) => updateOrderStatus(order.id, event.target.value)}>
                <option>pending</option>
                <option>paid</option>
                <option>processing</option>
                <option>shipped</option>
                <option>completed</option>
                <option>cancelled</option>
              </select>
            </article>
          ))}
          {!orders.length && <p>No orders yet.</p>}
        </div>
      </div>
    </section>
  );
}
