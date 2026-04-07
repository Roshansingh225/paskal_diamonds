create extension if not exists "uuid-ossp";

create table if not exists users (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  email text unique,
  phone text,
  role text default 'user',
  created_at timestamp default now()
);

create table if not exists products (
  id uuid primary key default uuid_generate_v4(),
  name text,
  price numeric,
  category text,
  image_url text,
  description text,
  stock integer default 0,
  created_at timestamp default now()
);

create table if not exists orders (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id),
  total_price numeric,
  payment_method text,
  status text default 'pending',
  created_at timestamp default now()
);

create table if not exists order_items (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid references orders(id) on delete cascade,
  product_id uuid references products(id),
  quantity integer,
  price numeric
);

create or replace function public.is_admin(user_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.users
    where id = user_id and role = 'admin'
  );
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, name, email, phone, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'name', ''),
    new.email,
    coalesce(new.raw_user_meta_data ->> 'phone', new.phone),
    'user'
  )
  on conflict (id) do update
  set
    name = coalesce(excluded.name, public.users.name),
    email = coalesce(excluded.email, public.users.email),
    phone = coalesce(excluded.phone, public.users.phone);

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

alter table users enable row level security;
alter table products enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;

drop policy if exists "Public products access" on products;
create policy "Public products access"
on products for select
using (true);

drop policy if exists "Admin manage products" on products;
create policy "Admin manage products"
on products for all
using (public.is_admin(auth.uid()));

drop policy if exists "Users insert own profile" on users;
create policy "Users insert own profile"
on users for insert
with check (auth.uid() = id);

drop policy if exists "Users view own profile" on users;
create policy "Users view own profile"
on users for select
using (auth.uid() = id);

drop policy if exists "Users update own profile" on users;
create policy "Users update own profile"
on users for update
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "Admin view profiles" on users;
create policy "Admin view profiles"
on users for select
using (public.is_admin(auth.uid()));

drop policy if exists "Users insert orders" on orders;
create policy "Users insert orders"
on orders for insert
with check (auth.uid() = user_id);

drop policy if exists "Users view own orders" on orders;
create policy "Users view own orders"
on orders for select
using (auth.uid() = user_id);

drop policy if exists "Admin view all orders" on orders;
create policy "Admin view all orders"
on orders for select
using (public.is_admin(auth.uid()));

drop policy if exists "Admin update orders" on orders;
create policy "Admin update orders"
on orders for update
using (public.is_admin(auth.uid()));

drop policy if exists "Insert order items" on order_items;
create policy "Insert order items"
on order_items for insert
with check (true);

drop policy if exists "Users view own order items" on order_items;
create policy "Users view own order items"
on order_items for select
using (
  exists (
    select 1 from orders
    where orders.id = order_items.order_id and orders.user_id = auth.uid()
  )
);

drop policy if exists "Admin view all order items" on order_items;
create policy "Admin view all order items"
on order_items for select
using (public.is_admin(auth.uid()));

drop policy if exists "Public product image access" on storage.objects;
create policy "Public product image access"
on storage.objects for select
using (bucket_id = 'product-images');

drop policy if exists "Admin product image uploads" on storage.objects;
create policy "Admin product image uploads"
on storage.objects for all
using (
  bucket_id = 'product-images' and public.is_admin(auth.uid())
)
with check (
  bucket_id = 'product-images' and public.is_admin(auth.uid())
);

insert into products (name, price, category, image_url, description, stock)
values
('Diamond Necklace', 85000, 'Necklace', 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=1200&q=80', 'A luminous diamond necklace set for signature evenings.', 5),
('Gold Ring', 25000, 'Ring', 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=1200&q=80', 'An elegant gold ring with a quiet, polished profile.', 10)
on conflict do nothing;
