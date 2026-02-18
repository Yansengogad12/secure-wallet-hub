
CREATE TABLE public.purchases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  product_name TEXT NOT NULL,
  product_price NUMERIC NOT NULL,
  daily_return NUMERIC NOT NULL,
  total_return NUMERIC NOT NULL,
  days_remaining INTEGER NOT NULL DEFAULT 50,
  earned_so_far NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own purchases" ON public.purchases FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own purchases" ON public.purchases FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own purchases" ON public.purchases FOR UPDATE USING (auth.uid() = user_id);

CREATE TRIGGER update_purchases_updated_at BEFORE UPDATE ON public.purchases FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to handle purchase: deduct balance, insert purchase
CREATE OR REPLACE FUNCTION public.purchase_product(
  p_product_name TEXT,
  p_product_price NUMERIC,
  p_daily_return NUMERIC,
  p_total_return NUMERIC
) RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public' AS $$
DECLARE
  v_user_id UUID;
  v_main_balance NUMERIC;
  v_member_level TEXT;
  v_active_count INTEGER;
  v_max_purchases INTEGER;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  SELECT main_balance, member_level INTO v_main_balance, v_member_level
  FROM profiles WHERE user_id = v_user_id FOR UPDATE;

  -- Check balance
  IF v_main_balance < p_product_price THEN
    RETURN json_build_object('success', false, 'error', 'Insufficient balance. Please deposit funds first.');
  END IF;

  -- Check membership limits
  SELECT COUNT(*) INTO v_active_count FROM purchases WHERE user_id = v_user_id AND status = 'active';
  v_max_purchases := CASE v_member_level
    WHEN 'starter' THEN 1
    WHEN 'mid-level' THEN 2
    WHEN 'vip' THEN 3
    ELSE 1
  END;

  IF v_active_count >= v_max_purchases THEN
    RETURN json_build_object('success', false, 'error', 'You have reached the maximum active contracts for your membership level (' || v_member_level || '). Upgrade to purchase more.');
  END IF;

  -- Deduct balance
  UPDATE profiles SET main_balance = main_balance - p_product_price WHERE user_id = v_user_id;

  -- Create purchase
  INSERT INTO purchases (user_id, product_name, product_price, daily_return, total_return)
  VALUES (v_user_id, p_product_name, p_product_price, p_daily_return, p_total_return);

  RETURN json_build_object('success', true, 'message', 'Purchase successful!');
END;
$$;
