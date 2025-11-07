# AI-Powered Itinerary Generation Implementation

## Overview
This implementation replaces the sample CSV-based itinerary generation with AI-powered generation using OpenAI's GPT models with a hybrid approach based on user tier.

## Features
- **Hybrid Model Selection**: 
  - Premium users: `gpt-4-turbo` (higher quality, more detailed)
  - Standard users: `gpt-3.5-turbo-0125` (cost-effective, fast)
- **Automatic Fallback**: If premium model fails due to rate limits, automatically falls back to standard model
- **Cost Tracking**: Tracks API costs per generation
- **Response Format Matching**: Ensures AI response matches the expected frontend structure

## Files Created/Modified

### New Files
1. **`lib/ai-service.ts`**: Core AI service with itinerary generation logic
2. **`lib/user-tier.ts`**: Utility functions to determine user tier

### Modified Files
1. **`app/api/itineraries/route.ts`**: Updated POST route to use AI generation instead of sample data

## Environment Variables Required

Add to your `.env` file:
```env
OPENAI_API_KEY=your_openai_api_key_here
```

## Usage

The itinerary generation is automatically triggered when creating a new itinerary via the POST endpoint:

```typescript
POST /api/itineraries
{
  // ... form data
  userTier?: "premium" | "standard", // Optional, defaults to "standard"
  userId?: string // Optional, for tier determination
}
```

## Model Selection Logic

```typescript
const getAIModel = (userTier: UserTier) => {
  switch(userTier) {
    case 'premium':
      return 'gpt-4-turbo';
    case 'standard':
      return 'gpt-3.5-turbo-0125';
    default:
      return 'gpt-3.5-turbo-0125';
  }
};
```

## Response Format

The AI generates itineraries matching this structure:

```typescript
{
  dailyItinerary: [
    {
      day: number,
      date: "DD MMM YY",
      title: string,
      activities: [
        {
          time: "HH:MM AM/PM",
          title: string,
          type: "SIGHTSEEING|ACTIVITY|MEAL|TRANSPORT|REST|ADVENTURE",
          description: string
        }
      ]
    }
  ],
  accommodation: [
    {
      name: string,
      rating: number (1-5),
      nights: number,
      image: string
    }
  ],
  budgetEstimation: {
    amount: number,
    currency: string,
    costTourist: number
  }
}
```

## Cost Optimization

- **Standard Tier**: ~$0.004-0.006 per itinerary
- **Premium Tier**: ~$0.08-0.12 per itinerary
- Automatic fallback to standard if premium fails
- Cost tracking included in response (optional)

## Error Handling

- If AI generation fails, falls back to empty arrays (maintains backward compatibility)
- Validates required fields before AI generation
- Handles JSON parsing errors gracefully
- Logs all errors for debugging

## Next Steps

1. Set `OPENAI_API_KEY` in your environment variables
2. Test with a sample itinerary generation
3. Optionally extend `getUserTierFromRequest()` to check user subscription status from database
4. Consider adding caching for similar itinerary requests to reduce costs

