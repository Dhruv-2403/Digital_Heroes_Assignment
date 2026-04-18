# Digital Heroes

A modern full-stack web application combining golf performance tracking, charitable giving, and a monthly prize draw system.

This repository is split into three primary services:
1. **Frontend (Subscriber Portal)**: React, Vite, React Router, Vanilla CSS architecture.
2. **Admin Panel**: React, Vite, React Router, Vanilla CSS architecture.
3. **Backend API**: Node.js, Express, Supabase (PostgreSQL), and Stripe Webhooks.

## System Architecture Overview

- **Auth**: JWT-based authentication with bcrypt hashing. Supabase is used strictly as a data store (PostgreSQL via service_role), while the Node.js backend handles all business logic, routing, and secret management.
- **Payments**: Stripe Checkout and Stripe Webhooks handle the subscription lifecycle safely.
- **Database**: Complex relational SQL schema utilizing Supabase triggers and indexes for draw pools, subscriptions, and charity assignments.
- **Draw Algorithm**: Implemented entirely in the backend with weighted distributions (inverse-frequency based mapping) to encourage jackpot rollovers.

## Running Locally

To run the full stack locally, you need a free Supabase instance and a Stripe test account.

### 1. Database Setup
Copy the contents of `backend/supabase/schema.sql` and run it in your Supabase project's SQL Editor. This will set up the entire relational structure and populate default test charities and an admin user.

### 2. Backend Config
Rename `backend/.env.example` to `backend/.env`. Fill in the required variables:
- `SUPABASE_URL` and `SUPABASE_SERVICE_KEY`
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
- `STRIPE_MONTHLY_PRICE_ID`, `STRIPE_YEARLY_PRICE_ID`

### 3. Start Processes

You can run each component in its own terminal window.

**Backend API**
```bash
cd backend
npm install
npm run dev
```
Runs continuously on `localhost:5001`. *(Note: port updated to 5001 to prevent macOS AirPlay collision on 5000)*.

**Frontend UI**
```bash
cd frontend
npm install
npm run dev
```
Available at `localhost:5173`. Uses Vite proxy to safely cross-communicate with backend API.

**Admin Panel**
```bash
cd admin
npm install
npm run dev
```
Available at `localhost:5174`. Uses Vite proxy. Login with `admin@digitalheroes.com` / `Admin@123`.

## Deployment

### Frontend & Admin Panel (Vercel)
Both React applications are fully optimized for direct Vercel zero-config deployments. Just import the `frontend` and `admin` folders as two separate Vercel projects. `vercel.json` rewrite configs are already included to prevent 404 errors on single page app deep linking.

### Backend (Render/Railway)
The Node.js Express server is built to deploy natively on platforms like Render or Railway. Set your production environment variables according to the `.env` requirements. Important: configure your production Stripe Webhook endpoint.