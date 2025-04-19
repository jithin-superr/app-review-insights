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

Follow these steps to deploy your App Review Insights application on Vercel:

1. Create a Vercel account if you don't have one already
2. Push your code to a GitHub, GitLab, or Bitbucket repository
3. Import your repository in Vercel
4. **Important**: Configure the following environment variables in your Vercel project settings:
   - `OPENROUTER_API_KEY` - Your OpenRouter API key (required for AI insights generation)
   - `OPENROUTER_URL` - OpenRouter API URL (defaults to `https://openrouter.ai/api/v1/chat/completions` if not set)
   - `PLAYSTORE_API_URL` - Play Store API Wrapper URL (defaults to `https://playstore-api-wrapper.onrender.com` if not set)

You can set these environment variables by going to:
1. Your Vercel project
2. Settings tab
3. Environment Variables section
4. Add each key-value pair

**Note**: If the AI insights aren't generated but reviews are fetched correctly, this usually indicates that the `OPENROUTER_API_KEY` environment variable is not properly set on your Vercel deployment.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Troubleshooting

If you encounter issues with the deployed application:

1. **API Key Issues**: Make sure your OpenRouter API key is correctly configured in environment variables.
   To check this, visit `/api/debug` on your deployed site (e.g., `https://your-app.vercel.app/api/debug`).

2. **Review Fetching Works but No Insights**: This likely means the OpenRouter API key is not properly configured.

3. **Rate Limits**: OpenRouter may have rate limits on free tier usage. If you're getting errors after multiple successful requests, you might be hitting rate limits.
