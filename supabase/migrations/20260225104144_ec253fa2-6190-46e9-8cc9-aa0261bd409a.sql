CREATE OR REPLACE FUNCTION public.purchase_product(p_product_name text, p_product_price numeric, p_daily_return numeric, p_total_return numeric)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id UUID;
  v_main_balance NUMERIC;
  v_member_level TEXT;
  v_active_count INTEGER;
  v_max_purchases INTEGER;
  v_purchase_id UUID;
  v_is_first_purchase BOOLEAN;
  v_referrer RECORD;
  v_rate NUMERIC;
  v_is_admin BOOLEAN;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  SELECT main_balance, member_level INTO v_main_balance, v_member_level
  FROM profiles WHERE user_id = v_user_id FOR UPDATE;

  IF v_main_balance < p_product_price THEN
    RETURN json_build_object('success', false, 'error', 'Insufficient balance. Please deposit funds first.');
  END IF;

  -- Check if user is admin
  v_is_admin := public.has_role(v_user_id, 'admin');

  -- Only enforce contract limits for non-admin users
  IF NOT v_is_admin THEN
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
  END IF;

  UPDATE profiles SET main_balance = main_balance - p_product_price WHERE user_id = v_user_id;

  INSERT INTO purchases (user_id, product_name, product_price, daily_return, total_return)
  VALUES (v_user_id, p_product_name, p_product_price, p_daily_return, p_total_return)
  RETURNING id INTO v_purchase_id;

  SELECT COUNT(*) = 1 INTO v_is_first_purchase FROM purchases WHERE user_id = v_user_id;

  IF v_is_first_purchase THEN
    FOR v_referrer IN 
      SELECT referrer_id, tier FROM team_members WHERE referred_id = v_user_id
    LOOP
      v_rate := CASE v_referrer.tier
        WHEN 1 THEN 0.10
        WHEN 2 THEN 0.05
        WHEN 3 THEN 0.01
        ELSE 0
      END;

      IF v_rate > 0 THEN
        INSERT INTO commissions (user_id, from_user_id, purchase_id, tier, rate, amount, status)
        VALUES (v_referrer.referrer_id, v_user_id, v_purchase_id, v_referrer.tier, v_rate, p_product_price * v_rate, 'credited');

        UPDATE profiles SET bonus_balance = bonus_balance + (p_product_price * v_rate),
                            total_earnings = total_earnings + (p_product_price * v_rate)
        WHERE user_id = v_referrer.referrer_id;
      END IF;
    END LOOP;
  END IF;

  RETURN json_build_object('success', true, 'message', 'Purchase successful!');
END;
$function$;