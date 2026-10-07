# Stripe payment integration

SHOWUP uses **Stripe Connect (Express accounts)** to run the two-sided
marketplace fee described in Prompt 5: a customer pays the vendor's price
plus SHOWUP's service fee, and the vendor's payout (price minus SHOWUP's
commission) is transferred to them directly by Stripe - SHOWUP's platform
account never has to manually move vendor money.

## Why Connect instead of plain Stripe Payments

Plain Stripe Checkout collects money into SHOWUP's own account; getting
part of it to a vendor would mean SHOWUP manually calculating and sending
payouts itself (its own ledger, its own 1099s, its own compliance burden).
Connect's **destination charges** push that onto Stripe: the platform
still authorizes the charge, but `transfer_data.destination` sends the
vendor's share straight to their own connected account, and
`application_fee_amount` is what stays with SHOWUP.

## The flow

1. **Vendor onboarding** (`POST /api/stripe/connect/onboard`) - creates a
   Stripe Express account for the vendor (once, the id is stored on
   `Vendor.stripeAccountId`) and returns a Stripe-hosted onboarding link.
   The vendor enters their own bank details, identity info, etc. directly
   with Stripe - SHOWUP never sees or stores that data.
2. **Status check** (`GET /api/stripe/connect/status`) - after the vendor
   returns from Stripe's hosted flow, this checks whether
   `details_submitted`, `charges_enabled`, and `payouts_enabled` are all
   true on their account, and updates `Vendor.stripeOnboardingComplete`.
   A booking can't be checked out against a vendor who hasn't cleared
   this.
3. **Checkout** (`POST /api/stripe/checkout`) - given a `bookingId`,
   computes the itemized breakdown via `packages/shared/src/pricing.ts`
   and creates a Stripe Checkout Session with two line items (vendor
   price + SHOWUP service fee) and `payment_intent_data` set to split the
   payment via `transfer_data.destination` (the vendor's account) and
   `application_fee_amount` (SHOWUP's cut).
4. **Webhook** (`POST /api/stripe/webhook`) - the source of truth for
   "did the payment actually succeed." On `checkout.session.completed`,
   marks the booking `paid` and stores the PaymentIntent id. The
   `/checkout/success` redirect page is just a UX nicety - never trust it
   alone to mark something paid, since the browser can fail to redirect.

## Local testing

```bash
# Terminal 1 - the app
npm run dev

# Terminal 2 - forward Stripe webhook events to your local server
# (install once: https://docs.stripe.com/stripe-cli)
stripe listen --forward-to localhost:3000/api/stripe/webhook
# copy the "whsec_..." it prints into .env.local as STRIPE_WEBHOOK_SECRET
```

Use Stripe's test card `4242 4242 4242 4242`, any future expiry, any CVC,
any ZIP, on the hosted Checkout page.

## Fee configuration

`PLATFORM_CUSTOMER_FEE_PERCENT` and `PLATFORM_VENDOR_COMMISSION_PERCENT`
in `.env.local` control the split - see `.env.example`. These are
**placeholder values (10% / 15%)**, not confirmed real numbers; change
them any time without redeploying code once a real config store exists
(Prompt 5/8 territory - env vars are a stand-in for that admin-editable
setting during the prototype phase).

## What's NOT built yet

- Refunds / cancellations (Prompt 5's "handle the full booking lifecycle
  including cancellation" is still open).
- Real vendor identity/business info collection on SHOWUP's side (Stripe
  collects it during onboarding, but nothing syncs it back into the
  `Vendor` record yet).
- The gift shop's own checkout (uses the same Stripe integration, but as
  a single-sided charge with no Connect split, since SHOWUP itself sells
  gift-shop products rather than a vendor).
