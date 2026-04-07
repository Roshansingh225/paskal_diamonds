import { ArrowRight, ShieldCheck, Sparkles, Truck } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <>
      <section className="hero">
        <div className="hero-overlay" />
        <div className="hero-content">
          <p className="eyebrow">Fine diamonds. Warm gold. Lasting light.</p>
          <h1>Paskal Diamonds</h1>
          <p>Handpicked jewellery for celebrations, heirlooms, and everyday brilliance.</p>
          <div className="hero-actions">
            <Link className="button primary" to="/products">Shop collection <ArrowRight size={18} /></Link>
            <Link className="button secondary" to="/auth">Book a private login</Link>
          </div>
        </div>
      </section>

      <section className="section promise-grid">
        <article>
          <Sparkles />
          <h3>Certified Stones</h3>
          <p>Diamonds selected for clarity, fire, and timeless wear.</p>
        </article>
        <article>
          <ShieldCheck />
          <h3>Secure Checkout</h3>
          <p>Supabase auth, protected orders, and trusted payment paths.</p>
        </article>
        <article>
          <Truck />
          <h3>Concierge Delivery</h3>
          <p>Order support over WhatsApp, UPI, or Razorpay.</p>
        </article>
      </section>

      <section className="section split-feature">
        <img src="https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=1400&q=80" alt="Gold diamond jewellery" />
        <div>
          <p className="eyebrow">The signature edit</p>
          <h2>Quiet luxury in gold, pearls, and diamonds.</h2>
          <p>Explore necklaces, rings, earrings, and bracelets designed for the soft gleam of special days.</p>
          <Link className="button primary" to="/products">View pieces</Link>
        </div>
      </section>
    </>
  );
}
