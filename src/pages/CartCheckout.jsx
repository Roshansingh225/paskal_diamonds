import { MessageCircle, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
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
  const { user, profile } = useAuth();
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [status, setStatus] = useState('');
  const [shipping, setShipping] = useState({
    customer_name: '',
    customer_phone: '',
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    postal_code: '',
    landmark: '',
  });

  useEffect(() => {
    setShipping((current) => ({
      ...current,
      customer_name: current.customer_name || profile?.name || user?.user_metadata?.name || '',
      customer_phone: current.customer_phone || profile?.phone || user?.phone || '',
    }));
  }, [profile, user]);

  const whatsappNumber = import.meta.env.VITE_WHATSAPP_NUMBER || '919999999999';
  const upiId = import.meta.env.VITE_UPI_ID;
  const isUpiConfigured = Boolean(upiId && upiId !== 'merchant@upi');
  const whatsappText = encodeURIComponent(`Hello Paskal Diamond, I would like to order: ${items.map((item) => `${item.quantity} x ${item.name}`).join(', ')}. Total: ${formatCurrency(total)}.`);

  function updateShipping(field, value) {
    setShipping((current) => ({ ...current, [field]: value }));
  }

  function validateShipping() {
    const requiredFields = [
      ['customer_name', 'Customer name'],
      ['customer_phone', 'Phone number'],
      ['address_line1', 'Address line 1'],
      ['city', 'City'],
      ['state', 'State'],
      ['postal_code', 'PIN code'],
    ];

    const missing = requiredFields.find(([field]) => !shipping[field]?.trim());
    if (missing) {
      setStatus(`${missing[1]} is required for delivery.`);
      return false;
    }

    return true;
  }

  function openUpiPayment(order) {
    if (!isUpiConfigured) {
      setStatus('Add your merchant UPI ID in VITE_UPI_ID to open UPI payment apps.');
      return;
    }

    const upiParams = new URLSearchParams({
      pa: upiId,
      pn: 'Paskal Diamond',
      am: String(Number(total).toFixed(2)),
      cu: 'INR',
      tn: `Paskal Diamond order ${order.id}`,
    });

    window.location.assign(`upi://pay?${upiParams.toString()}`);
    setStatus('Opening your UPI app. Complete the payment there, then return to this page.');
  }

  async function createOrder(method) {
    if (!items.length) return null;
    if (!hasSupabaseConfig || !user) {
      setStatus('Sign in with Supabase enabled to save this order.');
      return null;
    }
    if (!validateShipping()) return null;

    const { data: order, error } = await supabase
      .from('orders')
      .insert({
        user_id: user.id,
        total_price: total,
        payment_method: method,
        ...shipping,
      })
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
      if (method === 'UPI' && !isUpiConfigured) {
        setStatus('UPI payment is not configured yet. Add your real VITE_UPI_ID first.');
        return;
      }

      setStatus('Creating your order...');
      const order = await createOrder(method);
      if (method === 'Razorpay' && order) {
        const ok = await loadRazorpay();
        if (!ok) throw new Error('Razorpay could not be loaded.');

        const razorpay = new window.Razorpay({
          key: import.meta.env.VITE_RAZORPAY_KEY_ID,
          amount: Number(total) * 100,
          currency: 'INR',
          name: 'Paskal Diamond',
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
        if (method === 'UPI') {
          openUpiPayment(order);
          return;
        }

        clearCart();
        setStatus('Order saved.');
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
                <div className="quantity-stepper">
                  <button type="button" onClick={() => updateQuantity(item.id, item.quantity - 1)} aria-label={`Decrease ${item.name}`}>
                    -
                  </button>
                  <span>{item.quantity}</span>
                  <button type="button" onClick={() => updateQuantity(item.id, item.quantity + 1)} aria-label={`Increase ${item.name}`}>
                    +
                  </button>
                </div>
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
        <div className="shipping-form">
          <label>
            Full name
            <input value={shipping.customer_name} onChange={(event) => updateShipping('customer_name', event.target.value)} placeholder="Rohan Singh" />
          </label>
          <label>
            Phone
            <input value={shipping.customer_phone} onChange={(event) => updateShipping('customer_phone', event.target.value)} placeholder="+91 98765 43210" />
          </label>
          <label>
            Address line 1
            <input value={shipping.address_line1} onChange={(event) => updateShipping('address_line1', event.target.value)} placeholder="House no, street, area" />
          </label>
          <label>
            Address line 2
            <input value={shipping.address_line2} onChange={(event) => updateShipping('address_line2', event.target.value)} placeholder="Apartment, floor, optional" />
          </label>
          <div className="checkout-grid">
            <label>
              City
              <input value={shipping.city} onChange={(event) => updateShipping('city', event.target.value)} placeholder="Delhi" />
            </label>
            <label>
              State
              <input value={shipping.state} onChange={(event) => updateShipping('state', event.target.value)} placeholder="Delhi" />
            </label>
          </div>
          <div className="checkout-grid">
            <label>
              PIN code
              <input value={shipping.postal_code} onChange={(event) => updateShipping('postal_code', event.target.value)} placeholder="110001" />
            </label>
            <label>
              Landmark
              <input value={shipping.landmark} onChange={(event) => updateShipping('landmark', event.target.value)} placeholder="Near metro station" />
            </label>
          </div>
        </div>
        <label>
          Payment method
          <select value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value)}>
            <option>UPI</option>
            <option>Razorpay</option>
          </select>
        </label>
        <button className="button primary full" disabled={!items.length} onClick={() => checkout(paymentMethod)}>
          {paymentMethod === 'UPI' ? 'Pay with UPI' : paymentMethod === 'Razorpay' ? 'Pay with Razorpay' : 'Place order'}
        </button>
        {paymentMethod === 'UPI' && (
          <p className="small-note">
            {isUpiConfigured
              ? `UPI app will open for ${upiId}.`
              : 'Add VITE_UPI_ID in environment variables to open UPI apps.'}
          </p>
        )}
        {paymentMethod !== 'UPI' && (
          <a className="button secondary full" href={`https://wa.me/${whatsappNumber}?text=${whatsappText}`} target="_blank" rel="noreferrer">
            <MessageCircle size={18} /> WhatsApp order
          </a>
        )}
        {paymentMethod === 'UPI' && (
          <a className="support-link" href={`https://wa.me/${whatsappNumber}?text=${whatsappText}`} target="_blank" rel="noreferrer">
            Need help? Chat on WhatsApp
          </a>
        )}
        {status && <p className="status-note">{status}</p>}
      </aside>
    </section>
  );
}
