
-- has_role function (table now exists)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Policy on user_roles (now function exists)
CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Admin policies on profiles
CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all profiles"
  ON public.profiles FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Admin policies on deposits
CREATE POLICY "Admins can view all deposits"
  ON public.deposits FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update deposits"
  ON public.deposits FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Admin policies on withdrawals
CREATE POLICY "Admins can view all withdrawals"
  ON public.withdrawals FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update withdrawals"
  ON public.withdrawals FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Admin policies on purchases
CREATE POLICY "Admins can view all purchases"
  ON public.purchases FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Admin policies on commissions
CREATE POLICY "Admins can view all commissions"
  ON public.commissions FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Admin policies on team_members
CREATE POLICY "Admins can view all team members"
  ON public.team_members FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Admin policies on referral_codes
CREATE POLICY "Admins can view all referral codes"
  ON public.referral_codes FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Admin approve deposit RPC
CREATE OR REPLACE FUNCTION public.admin_approve_deposit(p_deposit_id uuid)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE v_deposit RECORD;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RETURN json_build_object('success', false, 'error', 'Not authorized');
  END IF;
  SELECT * INTO v_deposit FROM deposits WHERE id = p_deposit_id;
  IF NOT FOUND OR v_deposit.status != 'pending' THEN
    RETURN json_build_object('success', false, 'error', 'Deposit not found or already processed');
  END IF;
  UPDATE deposits SET status = 'approved', updated_at = now() WHERE id = p_deposit_id;
  UPDATE profiles SET main_balance = main_balance + v_deposit.amount WHERE user_id = v_deposit.user_id;
  RETURN json_build_object('success', true, 'message', 'Deposit approved and ' || v_deposit.amount || ' RWF credited.');
END;
$$;

-- Admin reject deposit RPC
CREATE OR REPLACE FUNCTION public.admin_reject_deposit(p_deposit_id uuid)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RETURN json_build_object('success', false, 'error', 'Not authorized');
  END IF;
  UPDATE deposits SET status = 'rejected', updated_at = now() WHERE id = p_deposit_id AND status = 'pending';
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Deposit not found or already processed');
  END IF;
  RETURN json_build_object('success', true, 'message', 'Deposit rejected.');
END;
$$;

-- Admin approve withdrawal RPC
CREATE OR REPLACE FUNCTION public.admin_approve_withdrawal(p_withdrawal_id uuid)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RETURN json_build_object('success', false, 'error', 'Not authorized');
  END IF;
  UPDATE withdrawals SET status = 'approved', updated_at = now() WHERE id = p_withdrawal_id AND status = 'pending';
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Withdrawal not found or already processed');
  END IF;
  RETURN json_build_object('success', true, 'message', 'Withdrawal approved.');
END;
$$;

-- Admin reject withdrawal RPC (refund balance)
CREATE OR REPLACE FUNCTION public.admin_reject_withdrawal(p_withdrawal_id uuid)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE v_withdrawal RECORD;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RETURN json_build_object('success', false, 'error', 'Not authorized');
  END IF;
  SELECT * INTO v_withdrawal FROM withdrawals WHERE id = p_withdrawal_id AND status = 'pending';
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Withdrawal not found or already processed');
  END IF;
  UPDATE withdrawals SET status = 'rejected', updated_at = now() WHERE id = p_withdrawal_id;
  UPDATE profiles SET withdrawable_balance = withdrawable_balance + v_withdrawal.amount WHERE user_id = v_withdrawal.user_id;
  RETURN json_build_object('success', true, 'message', 'Withdrawal rejected and balance refunded.');
END;
$$;

-- Update create_deposit to pending (admin approval required)
CREATE OR REPLACE FUNCTION public.create_deposit(p_amount numeric, p_phone text, p_payment_method text)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Not authenticated');
  END IF;
  IF p_amount < 6000 OR p_amount > 5000000 THEN
    RETURN json_build_object('success', false, 'error', 'Amount must be between 6,000 and 5,000,000 RWF');
  END IF;
  INSERT INTO deposits (user_id, amount, phone, payment_method, status)
  VALUES (v_user_id, p_amount, p_phone, p_payment_method, 'pending');
  RETURN json_build_object('success', true, 'message', 'Deposit request of ' || p_amount || ' RWF submitted. Awaiting admin approval.');
END;
$$;
