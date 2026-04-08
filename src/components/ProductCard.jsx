import { Check } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { formatCurrency } from '../lib/supabase';

export default function ProductCard({ product }) {
  const { addToCart } = useCart();
  const [added, setAdded] = useState(false);

  function handleAdd() {
    addToCart(product);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1200);
  }

  return (
    <article className={added ? 'product-card just-added' : 'product-card'}>
      <Link to={`/products/${product.id}`} className="product-image-wrap">
        <img src={product.image_url} alt={product.name} />
      </Link>
      <div className="product-card-body">
        <p className="eyebrow">{product.category}</p>
        <h3>{product.name}</h3>
        <p>{product.description}</p>
        <div className="product-card-footer">
          <strong>{formatCurrency(product.price)}</strong>
          <button className={added ? 'added' : ''} onClick={handleAdd}>
            {added ? <><Check size={16} /> Added</> : 'Add'}
          </button>
        </div>
      </div>
    </article>
  );
}
