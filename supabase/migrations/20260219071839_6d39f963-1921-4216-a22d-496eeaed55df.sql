
-- Referral codes table
CREATE TABLE public.referral_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  code TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.referral_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own referral code"
  ON public.referral_codes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view any referral code by code"
  ON public.referral_codes FOR SELECT
  USING (true);

-- Team members table (tracks referral relationships)
CREATE TABLE public.team_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_id UUID NOT NULL,
  referred_id UUID NOT NULL,
  tier INTEGER NOT NULL CHECK (tier IN (1, 2, 3)),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (referrer_id, referred_id)
);

ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own team members"
  ON public.team_members FOR SELECT
  USING (auth.uid() = referrer_id);

-- Commissions table
CREATE TABLE public.commissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  from_user_id UUID NOT NULL,
  purchase_id UUID,
  tier INTEGER NOT NULL CHECK (tier IN (1, 2, 3)),
  rate NUMERIC NOT NULL,
  amount NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.commissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own commissions"
  ON public.commissions FOR SELECT
  USING (auth.uid() = user_id);

-- Trigger for commissions updated_at
CREATE TRIGGER update_commissions_updated_at
  BEFORE UPDATE ON public.commissions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to generate a unique referral code
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_code TEXT;
  v_exists BOOLEAN;
BEGIN
  LOOP
    v_code := upper(substr(md5(random()::text), 1, 8));
    SELECT EXISTS(SELECT 1 FROM referral_codes WHERE code = v_code) INTO v_exists;
    IF NOT v_exists THEN
      RETURN v_code;
    END IF;
  END LOOP;
END;
$$;

-- Update handle_new_user to generate referral code and process referral
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_referral_code TEXT;
  v_referrer_id UUID;
  v_tier2_referrer_id UUID;
  v_tier3_referrer_id UUID;
BEGIN
  -- Create profile
  INSERT INTO public.profiles (user_id, full_name, phone, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    COALESCE(NEW.email, '')
  );

  -- Generate referral code for new user
  INSERT INTO public.referral_codes (user_id, code)
  VALUES (NEW.id, public.generate_referral_code());

  -- Process referral if a referral code was provided
  v_referral_code := NEW.raw_user_meta_data->>'referral_code';
  IF v_referral_code IS NOT NULL AND v_referral_code != '' THEN
    -- Find the referrer
    SELECT user_id INTO v_referrer_id FROM referral_codes WHERE code = upper(v_referral_code);
    
    IF v_referrer_id IS NOT NULL AND v_referrer_id != NEW.id THEN
      -- Tier 1: Direct referral
      INSERT INTO team_members (referrer_id, referred_id, tier)
      VALUES (v_referrer_id, NEW.id, 1)
      ON CONFLICT DO NOTHING;

      -- Tier 2: Find referrer's Tier 1 upline
      SELECT referrer_id INTO v_tier2_referrer_id 
      FROM team_members WHERE referred_id = v_referrer_id AND tier = 1 LIMIT 1;
      
      IF v_tier2_referrer_id IS NOT NULL THEN
        INSERT INTO team_members (referrer_id, referred_id, tier)
        VALUES (v_tier2_referrer_id, NEW.id, 2)
        ON CONFLICT DO NOTHING;

        -- Tier 3: Find tier2 referrer's Tier 1 upline
        SELECT referrer_id INTO v_tier3_referrer_id 
        FROM team_members WHERE referred_id = v_tier2_referrer_id AND tier = 1 LIMIT 1;
        
        IF v_tier3_referrer_id IS NOT NULL THEN
          INSERT INTO team_members (referrer_id, referred_id, tier)
          VALUES (v_tier3_referrer_id, NEW.id, 3)
          ON CONFLICT DO NOTHING;
        END IF;
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Update purchase_product to calculate commissions on first purchase
CREATE OR REPLACE FUNCTION public.purchase_product(p_product_name text, p_product_price numeric, p_daily_return numeric, p_total_return numeric)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
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
  VALUES (v_user_id, p_product_name, p_product_price, p_daily_return, p_total_return)
  RETURNING id INTO v_purchase_id;

  -- Check if this is the user's first purchase (commissions only on first)
  SELECT COUNT(*) = 1 INTO v_is_first_purchase FROM purchases WHERE user_id = v_user_id;

  IF v_is_first_purchase THEN
    -- Calculate commissions for all tier referrers
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

        -- Credit commission to referrer's bonus balance
        UPDATE profiles SET bonus_balance = bonus_balance + (p_product_price * v_rate),
                            total_earnings = total_earnings + (p_product_price * v_rate)
        WHERE user_id = v_referrer.referrer_id;
      END IF;
    END LOOP;
  END IF;

  RETURN json_build_object('success', true, 'message', 'Purchase successful!');
END;
$$;
