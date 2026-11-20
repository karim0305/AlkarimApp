# Al Karim Styloes – mobile app (Android + iOS)

React Native + Expo (SDK 58, Expo Router) app for the Al Karim Styloes clothing marketplace.
It talks to the **same Supabase database** as the website, so orders, shops, products, reviews and payments are shared.

## What is inside

| Role | Features |
| --- | --- |
| **Customer** | Home (announcement bar, hero slider, product rows, shops, reviews), browse + search + filters, product page (gallery, sizes, colours, code, reviews, related), cart, Cash-on-Delivery checkout (one order per shop, per-shop delivery charge), orders (cancel, "I received this order", dispute a shop's cancellation, write reviews), register, login, forgot password with a 6-digit email code, Terms & Conditions |
| **Shop owner** | Register a shop (terms must be accepted), approval gate, dashboard (key numbers only), incoming orders with customer address + Call / WhatsApp, confirm → process → ship → deliver, cancel with a reason, products (add / edit / delete, up to 5 photos, locked shop code + your own number), commission payments (submit and edit until received), reviews, shop profile, delivery charges |
| **Admin** | Dashboard (key numbers and what needs action), orders (**Refer** to a shop, cancel, delivery checks), approve / reject / activate / deactivate shops, commission by shop (all time and date range), commission payments (shop filter, **Receive**), products, categories, customers, reviews (hide / show), homepage control (announcements, banners, product rows), commission rate |

Only **customer** accounts can add to cart or order. A shop owner or admin sees *"Please log in from the Customer Panel to place an order."*

## Run it on your phone (2 minutes)

1. Install Node.js 20 or newer.
2. In this folder: `npm install`
3. `npx expo start`
4. Install **Expo Go** on your phone (Play Store / App Store) and scan the QR code.
   For an emulator: press `a` (Android) or `i` (iOS, Mac only).

The Supabase address and the *publishable* key are already in `.env`. Use only the publishable (anon) key in the app. Never put the secret / service_role key here.

## Make an installable app

```bash
npm install -g eas-cli
eas login
eas init                          # first time only: links the project to your Expo account
eas build -p android --profile preview      # APK you can install directly (free Expo account)
eas build -p android --profile production   # AAB for the Google Play Store
eas build -p ios --profile production       # iPhone build (needs an Apple Developer account, about USD 99 / year)
eas submit -p ios                           # sends it to App Store Connect / TestFlight
```

* The app id is `com.alkarim.styloes` (`app.json`). Change it **before the first store upload**: it cannot be changed afterwards.
* The Supabase keys for cloud builds are in `eas.json` (the cloud builder does not see your `.env`).
* To use a different database (for example a test project), change the two keys in `.env` for local runs and in `eas.json` for builds.

## Before it works end to end

All migrations `001` … `012` from the website project must have been run in Supabase, and for the password code email: Authentication → Email Templates → Reset Password must show `{{ .Token }}`, and Authentication → SMTP must be set up (see the website notes).

## Folders

```
src/app/            screens (Expo Router): (customer)/ tabs, shop/ tabs, admin/ tabs, plus detail screens
src/components/     shared UI (ui.tsx), order details, reviews, homepage editors
src/services/       all Supabase calls (same logic as the website)
src/context/        login, cart, toast, commission rate
src/lib/            types, formatting, theme, brand details (brand.ts)
assets/             icon, adaptive icon, splash (made from your logo)
```

Name, email and phone shown in the app come from `src/lib/brand.ts`.
