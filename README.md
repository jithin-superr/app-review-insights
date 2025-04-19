This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

# App Review Insights

A web application that fetches Google Play Store reviews for apps and generates AI-powered insights based on user feedback.

## Features

- Fetches app reviews from Google Play Store via a custom API
- Generates AI-powered insights using OpenRouter API (with models like Gemma 3)
- Shows common praises, complaints, feature requests, and actionable recommendations
- Performs sentiment analysis on reviews

## APIs Used

- [Play Store API Wrapper](https://playstore-api-wrapper.onrender.com/) - for fetching app reviews
- [OpenRouter](https://openrouter.ai/) - for AI-powered insights generation

## Getting Started

First, set up your environment variables:

1. Create a `.env.local` file in the project root with:
```
OPENROUTER_API_KEY=your_openrouter_api_key
OPENROUTER_URL=https://openrouter.ai/api/v1/chat/completions
PLAYSTORE_API_URL=https://playstore-api-wrapper.onrender.com
```

Then, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Using the App

1. Enter an app ID (e.g., `com.duolingo`, `com.spotify.music`) in the input field
2. Click "Analyze Reviews" to fetch reviews and generate insights
3. View the generated insights and review details

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
