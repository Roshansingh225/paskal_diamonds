import { MessageCircle, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { formatCurrency, hasSupabaseConfig, supabase } from '../lib/supabase';

function loadRazorpay() {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function CartCheckout() {
  const { items, total, updateQuantity, removeFromCart, clearCart } = useCart();
  const { user } = useAuth();
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [status, setStatus] = useState('');

  const whatsappNumber = import.meta.env.VITE_WHATSAPP_NUMBER || '919999999999';
  const whatsappText = encodeURIComponent(`Hello Paskal Diamonds, I would like to order: ${items.map((item) => `${item.quantity} x ${item.name}`).join(', ')}. Total: ${formatCurrency(total)}.`);

  async function createOrder(method) {
    if (!items.length) return null;
    if (!hasSupabaseConfig || !user) {
      setStatus('Sign in with Supabase enabled to save this order.');
      return null;
    }

    const { data: order, error } = await supabase
      .from('orders')
      .insert({ user_id: user.id, total_price: total, payment_method: method })
      .select()
      .single();

    if (error) throw error;

    const orderItems = items.map((item) => ({
      order_id: order.id,
      product_id: item.id,
      quantity: item.quantity,
      price: item.price,
    }));

    const { error: itemError } = await supabase.from('order_items').insert(orderItems);
    if (itemError) throw itemError;
    return order;
  }

  async function checkout(method = paymentMethod) {
    try {
      setStatus('Creating your order...');
      const order = await createOrder(method);
      if (method === 'Razorpay' && order) {
        const ok = await loadRazorpay();
        if (!ok) throw new Error('Razorpay could not be loaded.');

        const razorpay = new window.Razorpay({
          key: import.meta.env.VITE_RAZORPAY_KEY_ID,
          amount: Number(total) * 100,
          currency: 'INR',
          name: 'Paskal Diamonds',
          description: `Order ${order.id}`,
          handler: () => {
            setStatus('Payment captured. Your order is pending fulfilment.');
            clearCart();
          },
          prefill: { email: user?.email },
          theme: { color: '#8d6528' },
        });
        razorpay.open();
        return;
      }

      if (order) {
        clearCart();
        setStatus(method === 'UPI' ? 'Order saved. Complete payment with your preferred UPI app.' : 'Order saved.');
      }
    } catch (error) {
      setStatus(error.message);
    }
  }

  return (
    <section className="page checkout-layout">
      <div>
        <div className="page-heading">
          <p className="eyebrow">Cart</p>
          <h1>Your selected jewels.</h1>
        </div>

        {!items.length && (
          <div className="empty-state">
            <p>Your cart is waiting for a little shine.</p>
            <Link className="button primary" to="/products">Browse collection</Link>
          </div>
        )}

        <div className="cart-list">
          {items.map((item) => (
            <article className="cart-item" key={item.id}>
              <img src={item.image_url} alt={item.name} />
              <div>
                <h3>{item.name}</h3>
                <p>{formatCurrency(item.price)}</p>
                <input
                  type="number"
                  min="1"
                  value={item.quantity}
                  onChange={(event) => updateQuantity(item.id, Number(event.target.value))}
                />
              </div>
              <button className="icon-button" onClick={() => removeFromCart(item.id)} aria-label={`Remove ${item.name}`}>
                <Trash2 />
              </button>
            </article>
          ))}
        </div>
      </div>

      <aside className="checkout-card">
        <p className="eyebrow">Checkout</p>
        <h2>{formatCurrency(total)}</h2>
        <label>
          Payment method
          <select value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value)}>
            <option>UPI</option>
            <option>Razorpay</option>
          </select>
        </label>
        <button className="button primary full" disabled={!items.length} onClick={() => checkout(paymentMethod)}>
          Place order
        </button>
        <a className="button secondary full" href={`https://wa.me/${whatsappNumber}?text=${whatsappText}`} target="_blank" rel="noreferrer">
          <MessageCircle size={18} /> WhatsApp order
        </a>
        {paymentMethod === 'UPI' && <p className="small-note">UPI intent/deep-link details can be added after the merchant VPA is confirmed.</p>}
        {status && <p className="status-note">{status}</p>}
      </aside>
    </section>
  );
}
