
ALTER TABLE public.tenants
ADD COLUMN subscription_status text NOT NULL DEFAULT 'none',
ADD COLUMN razorpay_customer_id text,
ADD COLUMN razorpay_subscription_id text,
ADD COLUMN razorpay_plan_id text;
