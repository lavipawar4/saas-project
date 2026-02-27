-- ============================================
-- Review Automation Schema (AMZTech-style)
-- ============================================

-- CUSTOMERS Table
CREATE TABLE IF NOT EXISTS public.customers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  tags TEXT[] DEFAULT '{}',
  last_interaction_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(business_id, email)
);

-- REVIEW REQUESTS Table
CREATE TABLE IF NOT EXISTS public.review_requests (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE NOT NULL,
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'opened', 'clicked', 'reviewed', 'failed')),
  sent_at TIMESTAMP WITH TIME ZONE,
  email_id TEXT, -- Resend message ID
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own customers" ON public.customers 
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.businesses WHERE businesses.id = customers.business_id AND businesses.user_id = auth.uid())
  );

CREATE POLICY "Users can manage own review requests" ON public.review_requests 
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.businesses WHERE businesses.id = review_requests.business_id AND businesses.user_id = auth.uid())
  );

-- Indexes
CREATE INDEX IF NOT EXISTS idx_customers_business_id ON public.customers(business_id);
CREATE INDEX IF NOT EXISTS idx_customers_tags ON public.customers USING GIN (tags);
CREATE INDEX IF NOT EXISTS idx_review_requests_status ON public.review_requests(status);
CREATE INDEX IF NOT EXISTS idx_review_requests_customer_id ON public.review_requests(customer_id);

-- Updated_at triggers
CREATE TRIGGER customers_updated_at BEFORE UPDATE ON public.customers FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER review_requests_updated_at BEFORE UPDATE ON public.review_requests FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
