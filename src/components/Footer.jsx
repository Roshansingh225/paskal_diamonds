import { Gem, Instagram, Mail, MapPin, MessageCircle, Phone } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Footer() {
  const whatsappNumber = import.meta.env.VITE_WHATSAPP_NUMBER || '919999999999';

  return (
    <footer className="site-footer">
      <div className="footer-main">
        <div className="footer-brand">
          <Link className="brand" to="/">
            <Gem size={24} />
            <span>Paskal Diamonds</span>
          </Link>
          <p>Fine jewellery for quiet celebrations, heirloom moments, and everyday light.</p>
          <div className="footer-socials">
            <a href={`https://wa.me/${whatsappNumber}`} target="_blank" rel="noreferrer" aria-label="Chat on WhatsApp">
              <MessageCircle size={18} />
            </a>
            <a href="https://instagram.com" target="_blank" rel="noreferrer" aria-label="Visit Instagram">
              <Instagram size={18} />
            </a>
          </div>
        </div>

        <div>
          <h3>Shop</h3>
          <Link to="/products">Necklaces</Link>
          <Link to="/products">Rings</Link>
          <Link to="/products">Bracelets</Link>
          <Link to="/products">Earrings</Link>
        </div>

        <div>
          <h3>Client Care</h3>
          <Link to="/cart">Checkout</Link>
          <Link to="/auth">Private Login</Link>
          <Link to="/products">Product Search</Link>
          <Link to="/admin">Admin</Link>
        </div>

        <div>
          <h3>Visit</h3>
          <p><MapPin size={16} /> Mumbai, India</p>
          <p><Phone size={16} /> +91 99999 99999</p>
          <p><Mail size={16} /> care@paskaldiamonds.com</p>
        </div>
      </div>

      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} Paskal Diamonds. All rights reserved.</span>
        <span>Secure orders powered by Supabase.</span>
      </div>
    </footer>
  );
}
