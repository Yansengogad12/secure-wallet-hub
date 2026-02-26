
CREATE OR REPLACE FUNCTION public.create_withdrawal(p_amount numeric, p_phone text, p_payment_method text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id UUID;
  v_withdrawable NUMERIC;
  v_bonus NUMERIC;
  v_available NUMERIC;
  v_has_deposit BOOLEAN;
  v_fee NUMERIC;
  v_net NUMERIC;
  v_from_withdrawable NUMERIC;
  v_from_bonus NUMERIC;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  IF p_amount < 1000 THEN
    RETURN json_build_object('success', false, 'error', 'Minimum withdrawal is 1,000 RWF');
  END IF;

  SELECT withdrawable_balance, bonus_balance INTO v_withdrawable, v_bonus
  FROM profiles WHERE user_id = v_user_id FOR UPDATE;

  -- Check if user has at least one approved deposit
  SELECT EXISTS(SELECT 1 FROM deposits WHERE user_id = v_user_id AND status = 'approved') INTO v_has_deposit;

  -- Available = withdrawable + bonus (if deposited)
  v_available := v_withdrawable;
  IF v_has_deposit THEN
    v_available := v_available + v_bonus;
  END IF;

  IF v_available < p_amount THEN
    RETURN json_build_object('success', false, 'error', 'Insufficient balance. You have ' || v_available || ' RWF available.');
  END IF;

  v_fee := p_amount * 0.10;
  v_net := p_amount - v_fee;

  -- Deduct from withdrawable first, then bonus
  v_from_withdrawable := LEAST(p_amount, v_withdrawable);
  v_from_bonus := p_amount - v_from_withdrawable;

  UPDATE profiles
  SET withdrawable_balance = withdrawable_balance - v_from_withdrawable,
      bonus_balance = bonus_balance - v_from_bonus
  WHERE user_id = v_user_id;

  INSERT INTO withdrawals (user_id, amount, fee, net_amount, phone, payment_method, status)
  VALUES (v_user_id, p_amount, v_fee, v_net, p_phone, p_payment_method, 'pending');

  RETURN json_build_object('success', true, 'message', 'Withdrawal of ' || v_net || ' RWF submitted to ' || p_phone || '. Processing may take up to 24 hours.');
END;
$function$;
