# VRRA Fitness App - Setup Guide

## Overview

VRRA is a premium fitness tracking app with AI-powered meal scanning, daily scoring, and subscription-based monetization using Supabase and Stripe.

## Architecture

- **Frontend**: Next.js 16 with React
- **Database**: Supabase PostgreSQL
- **Authentication**: Supabase Auth
- **Payments**: Stripe
- **Deployment**: Vercel

## Prerequisites

1. Supabase account and project
2. Stripe account
3. Node.js 18+
4. Environment variables configured

## Database Setup

Run this SQL in your Supabase SQL Editor to create the schema:

```sql
-- Users profiles table
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  is_premium BOOLEAN DEFAULT FALSE,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  daily_score INT DEFAULT 0,
  streak INT DEFAULT 0
);

-- Meal scans table
CREATE TABLE scans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  meal_name TEXT NOT NULL,
  calories INT,
  protein DECIMAL,
  carbs DECIMAL,
  fat DECIMAL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Daily stats table
CREATE TABLE daily_stats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  daily_score INT,
  calories_consumed INT,
  protein DECIMAL,
  carbs DECIMAL,
  fat DECIMAL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, date)
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_stats ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- RLS Policies for scans
CREATE POLICY "Users can view their own scans"
  ON scans FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own scans"
  ON scans FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for daily_stats
CREATE POLICY "Users can view their own stats"
  ON daily_stats FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own stats"
  ON daily_stats FOR UPDATE
  USING (auth.uid() = user_id);
```

## Environment Variables Setup

1. Copy `.env.example` to `.env.local`
2. Fill in your Supabase credentials:
   - Go to Supabase Project → Settings → API
   - Copy URL and anon key
3. Fill in your Stripe credentials:
   - Get publishable key, secret key from Stripe Dashboard
   - Create a webhook endpoint at `/api/webhooks/stripe`
   - Get the webhook secret from Stripe
4. Create a Stripe price (product with price) for the subscription:
   - Set to $9.99/month or annual billing
   - Copy the price ID to `NEXT_PUBLIC_STRIPE_PRICE_ID`

## Routes Overview

### Public Routes
- `/` - Landing page
- `/auth/login` - Login page
- `/auth/signup` - Sign up page
- `/auth/confirm-email` - Email confirmation page

### Protected Routes (Require Authentication)
- `/app` - Main app with tabs:
  - Home (daily score, calories, macros)
  - Scan (meal scanning with camera)
  - Progress (streaks and analytics)
  - Premium (upgrade page)
- `/app/success` - Payment success page

### API Routes
- `POST /api/checkout` - Create Stripe checkout session
- `POST /api/scans` - Record a meal scan
- `GET /api/scans` - Get today's scan count
- `POST /api/webhooks/stripe` - Stripe webhook handler

## Key Features

### Freemium Model
- Free users: 3 meal scans per day
- Premium users: Unlimited scans
- Paywall triggers when scan limit reached

### Authentication Flow
1. User signs up with email/password
2. Confirmation email sent
3. After confirmation, user can sign in
4. Session persists with Supabase Auth

### Payment Flow
1. User clicks "Upgrade" button
2. Redirected to Stripe checkout
3. After successful payment, webhook updates profile
4. User gains premium access immediately

### Scan Tracking
- Each scan recorded to database
- Daily scan count tracked
- Scan details (calories, macros) stored
- Free users see limit counter (X/3 scans)

## Development

```bash
# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your keys

# Run development server
pnpm dev

# The app runs on http://localhost:3000
```

## Testing the Payment Flow

1. Use Stripe test keys (if in test mode)
2. Test card: 4242 4242 4242 4242
3. Any future expiry date
4. Any 3-digit CVC
5. After payment, check Supabase console to verify webhook updated user profile

## Deployment

1. Connect your GitHub repo to Vercel
2. Add environment variables in Vercel project settings
3. Update Stripe webhook endpoint to your production URL
4. Deploy with `git push`

## Monitoring & Debugging

- Check Supabase logs for database errors
- Monitor Stripe dashboard for payment issues
- Review webhook logs in Stripe dashboard
- Use browser DevTools to debug frontend issues

## Support

For issues:
1. Check Supabase documentation
2. Review Stripe API reference
3. Check browser console for errors
4. Verify all environment variables are set correctly
