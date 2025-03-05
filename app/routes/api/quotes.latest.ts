import { json } from '@tanstack/react-start'
import { createAPIFileRoute } from '@tanstack/react-start/api'
import { quoteService } from '@core/services/quote-service'

export const APIRoute = createAPIFileRoute('/api/quotes/latest')({
  GET: async ({ request, params }) => {
    const data = await quoteService.getLatestQuotes(25)
    return json({ data })
  },
})
