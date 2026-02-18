
-- Create withdrawals table
CREATE TABLE public.withdrawals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  amount NUMERIC NOT NULL,
  fee NUMERIC NOT NULL,
  net_amount NUMERIC NOT NULL,
  phone TEXT NOT NULL,
  payment_method TEXT NOT NULL DEFAULT 'mtn',
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own withdrawals" ON public.withdrawals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own withdrawals" ON public.withdrawals FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_withdrawals_updated_at
  BEFORE UPDATE ON public.withdrawals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create withdrawal RPC
CREATE OR REPLACE FUNCTION public.create_withdrawal(p_amount NUMERIC, p_phone TEXT, p_payment_method TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id UUID;
  v_withdrawable NUMERIC;
  v_fee NUMERIC;
  v_net NUMERIC;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  IF p_amount < 1000 THEN
    RETURN json_build_object('success', false, 'error', 'Minimum withdrawal is 1,000 RWF');
  END IF;

  SELECT withdrawable_balance INTO v_withdrawable FROM profiles WHERE user_id = v_user_id FOR UPDATE;

  IF v_withdrawable < p_amount THEN
    RETURN json_build_object('success', false, 'error', 'Insufficient withdrawable balance. You have ' || v_withdrawable || ' RWF available.');
  END IF;

  v_fee := p_amount * 0.10;
  v_net := p_amount - v_fee;

  -- Deduct from withdrawable balance
  UPDATE profiles SET withdrawable_balance = withdrawable_balance - p_amount WHERE user_id = v_user_id;

  -- Record withdrawal
  INSERT INTO withdrawals (user_id, amount, fee, net_amount, phone, payment_method, status)
  VALUES (v_user_id, p_amount, v_fee, v_net, p_phone, p_payment_method, 'pending');

  RETURN json_build_object('success', true, 'message', 'Withdrawal of ' || v_net || ' RWF submitted to ' || p_phone || '. Processing may take up to 24 hours.');
END;
$$;
