# Deployment Guide: PrimeTrade FX Platform

This guide outlines the steps required to deploy the PrimeTrade FX brokerage platform to a production environment.

## 1. Supabase Configuration

### Database Schema

1. Ensure all tables are created in the `public` schema:
   - `profiles`
   - `accounts`
   - `transactions`
   - `trades`
2. Enable Row Level Security (RLS) on all tables.
3. Configure the following policies:
   - Users can only read/write their own data.
   - Admins (role = 'admin') have full access to all tables.

### Storage

- Create a private bucket named `kyc-documents`.
- Set up RLS policies:
  - `authenticated` users can upload to their own folder (`userId/*`).
  - `admin` role can read all folders.

## 2. Environment Variables

Create a `.env.production` file with the following variables:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key (used for admin operations)
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=https://your-domain.com
```

## 3. Deployment Steps

### Vercel (Recommended)

1. Connect your GitHub repository to Vercel.
2. Add the environment variables in the project settings.
3. Vercel will automatically detect the Next.js framework and deploy.

### Manual Build

If deploying to a custom server or Cloud Run:

1. Run `npm install`.
2. Run `npm run build`.
3. Start the production server with `npm start`.

## 4. Post-Deployment Verification

- [ ] Verify that the landing page loads correctly.
- [ ] Test the "Try Demo" functionality.
- [ ] Ensure that `/admin` is only accessible to users with the `admin` role.
- [ ] Check that KYC documents are successfully uploaded to Supabase Storage.
- [ ] Confirm that real-time price updates are working on the dashboard.
