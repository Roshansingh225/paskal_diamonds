import { ShoppingBag, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuthPrompt } from '../context/AuthPromptContext';

export default function AuthPromptModal() {
  const { open, closeAuthPrompt } = useAuthPrompt();

  if (!open) return null;

  return (
    <div className="modal-backdrop" onClick={closeAuthPrompt}>
      <section className="auth-prompt-modal" onClick={(event) => event.stopPropagation()}>
        <button className="icon-button modal-close" onClick={closeAuthPrompt} aria-label="Close sign in prompt">
          <X size={18} />
        </button>
        <div className="modal-icon">
          <ShoppingBag size={20} />
        </div>
        <p className="eyebrow">Continue checkout</p>
        <h2>Sign in to continue.</h2>
        <p>Your item is in the cart. Log in to save your details and place the order smoothly.</p>
        <div className="button-row">
          <Link className="button primary" to="/auth" onClick={closeAuthPrompt}>Sign in</Link>
          <button className="button secondary" onClick={closeAuthPrompt}>Continue shopping</button>
        </div>
      </section>
    </div>
  );
}
