import { json } from '@tanstack/react-start'
import { createAPIFileRoute } from '@tanstack/react-start/api'
import { quoteService } from '@core/services/quote-service'

export const APIRoute = createAPIFileRoute('/api/quotes/latest')({
  GET: async ({ request, params }) => {
    console.info(`Fetching quotes...`)
    const data = await quoteService.getLatestQuotes(25)
    // No need to wrap data in another array if it's already an array
    return json(data)
  },
})
