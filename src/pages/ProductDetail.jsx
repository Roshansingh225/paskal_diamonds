import { Check, MessageCircle, ShoppingBag } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useAuthPrompt } from '../context/AuthPromptContext';
import { useCart } from '../context/CartContext';
import { formatCurrency, getProduct } from '../lib/supabase';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { user } = useAuth();
  const { openAuthPrompt } = useAuthPrompt();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [added, setAdded] = useState(false);

  useEffect(() => {
    getProduct(id)
      .then(setProduct)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <section className="page"><p>Opening the jewel case...</p></section>;
  if (error || !product) return <section className="page"><p className="error">{error || 'Product not found.'}</p></section>;

  const whatsappNumber = import.meta.env.VITE_WHATSAPP_NUMBER || '919999999999';
  const whatsappText = encodeURIComponent(`Hello Paskal Diamond, I am interested in ${product.name} (${formatCurrency(product.price)}).`);

  function handleAdd() {
    if (added) {
      navigate('/cart');
      return;
    }

    addToCart(product);
    setAdded(true);
    if (!user) openAuthPrompt();
  }

  return (
    <section className="page detail-layout">
      <img className="detail-image" src={product.image_url} alt={product.name} />
      <div className="detail-copy">
        <p className="eyebrow">{product.category}</p>
        <h1>{product.name}</h1>
        <p>{product.description}</p>
        <strong className="detail-price">{formatCurrency(product.price)}</strong>
        <p className="stock-note">{product.stock > 0 ? `${product.stock} available` : 'Available on request'}</p>
        <div className="button-row">
          <button className={added ? 'button primary added-to-cart' : 'button primary'} onClick={handleAdd}>
            {added ? <><Check size={18} /> Go to cart</> : <><ShoppingBag size={18} /> Add to cart</>}
          </button>
          <a className="button secondary" href={`https://wa.me/${whatsappNumber}?text=${whatsappText}`} target="_blank" rel="noreferrer">
            <MessageCircle size={18} /> WhatsApp order
          </a>
        </div>
        <Link to="/products" className="back-link">Back to collection</Link>
      </div>
    </section>
  );
}
