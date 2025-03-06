import { json } from '@tanstack/react-start'
import { createAPIFileRoute } from '@tanstack/react-start/api'
import { quoteService } from '@core/services/quote-service'

export const APIRoute = createAPIFileRoute('/api/quotes/random')({
  GET: async ({ request, params }) => {
    console.info(`Fetching random quotes...`)
    const data = await quoteService.getRandomQuotes(25)
    return json(data)
  },
})
