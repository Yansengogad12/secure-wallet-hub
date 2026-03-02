
-- Create products table
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Agricultural',
  price NUMERIC NOT NULL,
  daily_return NUMERIC NOT NULL,
  total_return NUMERIC NOT NULL,
  image TEXT NOT NULL DEFAULT '📦',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Everyone can view active products
CREATE POLICY "Anyone can view active products" ON public.products FOR SELECT USING (is_active = true);

-- Admins can do everything
CREATE POLICY "Admins can view all products" ON public.products FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can insert products" ON public.products FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update products" ON public.products FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete products" ON public.products FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- Seed with existing hardcoded products
INSERT INTO public.products (name, category, price, daily_return, total_return, image) VALUES
  ('Premium Potato Seeds', 'Agricultural', 10000, 500, 25000, '🥔'),
  ('Organic Bean Stock', 'Agricultural', 15000, 750, 37500, '🫘'),
  ('Layer Chickens (10 pcs)', 'Livestock', 50000, 2500, 125000, '🐔'),
  ('Maize Flour Mill Share', 'Small Business', 100000, 5000, 250000, '🌽'),
  ('Digital Equipment Bundle', 'Digital Services', 200000, 10000, 500000, '💻'),
  ('Transport Motorcycle Share', 'Transport', 500000, 25000, 1250000, '🏍️');

-- Trigger for updated_at
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
