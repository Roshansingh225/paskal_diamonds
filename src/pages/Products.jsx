import { Search } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import ProductCard from '../components/ProductCard';
import { getProducts } from '../lib/supabase';

export default function Products() {
  const [products, setProducts] = useState([]);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getProducts()
      .then(setProducts)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const categories = useMemo(
    () => ['All', ...new Set(products.map((product) => product.category).filter(Boolean))],
    [products],
  );

  const filtered = products.filter((product) => {
    const matchesQuery = [product.name, product.description, product.category]
      .join(' ')
      .toLowerCase()
      .includes(query.toLowerCase());
    const matchesCategory = category === 'All' || product.category === category;
    return matchesQuery && matchesCategory;
  });

  return (
    <section className="page">
      <div className="page-heading">
        <p className="eyebrow">Collection</p>
        <h1>Jewellery with a soft gold glow.</h1>
      </div>

      <div className="filters">
        <label className="search-input">
          <Search size={18} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search necklace, ring, pearl..." />
        </label>
        <div className="chip-row">
          {categories.map((item) => (
            <button className={category === item ? 'chip active' : 'chip'} key={item} onClick={() => setCategory(item)}>
              {item}
            </button>
          ))}
        </div>
      </div>

      {loading && <p>Polishing the collection...</p>}
      {error && <p className="error">{error}</p>}
      {!loading && !filtered.length && <p>No pieces matched your search.</p>}

      <div className="product-grid">
        {filtered.map((product) => <ProductCard key={product.id} product={product} />)}
      </div>
    </section>
  );
}
