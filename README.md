# ExpenseLens

ExpenseLens is a modern, AI-powered mobile expense tracker built with Flutter and Node.js. It allows users to automatically extract transaction details from UPI/payment screenshots using local JavaScript OCR, categorize them intelligently, and visualize spending habits via colorful pie charts.

## Architecture

![Architecture](https://upload.wikimedia.org/wikipedia/commons/1/17/GraphQL_Logo.svg) <!-- Replace with real architecture diagram if needed -->

1. **Frontend (Flutter)**: A beautiful, cross-platform mobile app featuring Google Auth, glassmorphic UI, smooth onboarding, and interactive `fl_chart` dashboards.
2. **Backend (Express API)**: A Node.js API hosted on Vercel. Handles Google OAuth token verification, Postgres database interactions, and the receipt parsing.
3. **Database (Neon Postgres)**: A serverless PostgreSQL database storing users, categories, rules, and transactions.
4. **OCR Engine (Tesseract.js)**: Runs securely in-memory on the Vercel backend to parse screenshot text and extract amounts, dates, and merchants using Regex.

## Features

- **Google Authentication**: Secure, one-tap login.
- **Smart Receipt Scanning**: Upload a UPI payment screenshot and automatically log the expense without manual data entry.
- **Premium UI**: Inspired by modern financial apps with smooth page transitions and interactive pie charts.
- **Monthly Summaries**: Instantly view category breakdowns and totals.

## Setup Instructions

### 1. Database Setup (Neon)
Create a project on [Neon.tech](https://neon.tech) and copy your `DATABASE_URL`.

### 2. Backend Setup
1. Navigate to the `server/` directory.
2. Run `npm install`.
3. Create a `.env` file with the following variables:
   ```env
   DATABASE_URL="your-neon-postgres-url"
   GOOGLE_CLIENT_ID="your-google-oauth-web-client-id"
   GOOGLE_CLIENT_SECRET="your-google-oauth-secret"
   ```
4. Run `npm run db:setup` to initialize the database tables.
5. Run `npm run dev` to start the server locally, or use Vercel CLI (`vercel --prod`) to deploy.

### 3. Frontend Setup
1. Navigate to the `app/` directory.
2. Run `flutter pub get`.
3. In `lib/services/api_client.dart`, update the `_baseUrl` to point to your backend.
4. In `lib/screens/login_screen.dart`, ensure `serverClientId` matches your Google Web Client ID.
5. Run `flutter run`.
