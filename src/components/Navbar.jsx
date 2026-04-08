import { Gem, Menu, ShoppingBag, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [cartBump, setCartBump] = useState(false);
  const previousCount = useRef(0);
  const { count } = useCart();
  const { user, isAdmin, signOut } = useAuth();

  const links = [
    ['Home', '/'],
    ['Products', '/products'],
    ['Checkout', '/cart'],
  ];

  if (isAdmin) links.push(['Admin', '/admin']);

  useEffect(() => {
    if (count > previousCount.current) {
      setCartBump(true);
      window.setTimeout(() => setCartBump(false), 650);
    }
    previousCount.current = count;
  }, [count]);

  async function handleSignOut() {
    await signOut();
    setOpen(false);
  }

  return (
    <header className="site-header">
      <Link className="brand" to="/" onClick={() => setOpen(false)}>
        <Gem size={24} />
        <span>Paskal Diamond</span>
      </Link>

      <button className="icon-button menu-toggle" onClick={() => setOpen((value) => !value)} aria-label="Open menu">
        {open ? <X /> : <Menu />}
      </button>

      <nav className={open ? 'nav-links open' : 'nav-links'}>
        {links.map(([label, href]) => (
          <NavLink key={href} to={href} onClick={() => setOpen(false)}>
            {label}
          </NavLink>
        ))}
        <Link className={cartBump ? 'cart-link cart-bump' : 'cart-link'} to="/cart" onClick={() => setOpen(false)}>
          <ShoppingBag size={18} />
          <span>{count}</span>
        </Link>
        {user ? (
          <button className="text-button" onClick={handleSignOut}>Sign out</button>
        ) : (
          <NavLink className="nav-cta" to="/auth" onClick={() => setOpen(false)}>Login</NavLink>
        )}
      </nav>
    </header>
  );
}
