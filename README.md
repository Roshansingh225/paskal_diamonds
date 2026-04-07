# Paskal Diamonds

Full-stack luxury jewellery ecommerce site built with React, Vite, Supabase Auth, Supabase Postgres, Supabase Storage, WhatsApp ordering, and a Razorpay checkout launcher.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Copy environment variables:

```bash
cp .env.example .env
```

3. Add your Supabase project URL and anon key to `.env`.

4. Run `supabase/schema.sql` in the Supabase SQL editor. It creates:

- `users`, `products`, `orders`, and `order_items`
- public `product-images` storage bucket
- RLS policies for public products, user orders, admin product management, admin orders, and storage uploads
- seed product data

5. Start the app:

```bash
npm run dev
```

## Admin Access

Create a user through the signup page, then promote it in Supabase SQL:

```sql
update users
set role = 'admin'
where email = 'admin@example.com';
```

The admin dashboard is available at `/admin`.

## Deployment

Deploy to Vercel and add these project environment variables:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_RAZORPAY_KEY_ID`
- `VITE_WHATSAPP_NUMBER`

Razorpay is wired for the client checkout launcher. For production payments, create Razorpay orders from a serverless function so the amount and receipt are verified server-side before capture.
