
CREATE TABLE public.deposits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  amount NUMERIC NOT NULL,
  phone TEXT NOT NULL,
  payment_method TEXT NOT NULL DEFAULT 'mtn',
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.deposits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own deposits" ON public.deposits FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own deposits" ON public.deposits FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_deposits_updated_at BEFORE UPDATE ON public.deposits FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to create deposit and credit balance (simulates instant approval for now)
CREATE OR REPLACE FUNCTION public.create_deposit(
  p_amount NUMERIC,
  p_phone TEXT,
  p_payment_method TEXT
) RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public' AS $$
DECLARE
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  IF p_amount < 6000 OR p_amount > 5000000 THEN
    RETURN json_build_object('success', false, 'error', 'Amount must be between 6,000 and 5,000,000 RWF');
  END IF;

  -- Insert deposit record as approved
  INSERT INTO deposits (user_id, amount, phone, payment_method, status)
  VALUES (v_user_id, p_amount, p_phone, p_payment_method, 'approved');

  -- Credit main balance
  UPDATE profiles SET main_balance = main_balance + p_amount WHERE user_id = v_user_id;

  RETURN json_build_object('success', true, 'message', 'Deposit of ' || p_amount || ' RWF credited successfully!');
END;
$$;
