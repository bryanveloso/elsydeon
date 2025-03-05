import { quoteService } from '@core/services/quote-service'
import { json } from '@tanstack/react-start'
import { createAPIFileRoute } from '@tanstack/react-start/api'

export const APIRoute = createAPIFileRoute('/api/quotes/$id')({
  GET: async ({ request, params }) => {
    const data = await quoteService.getQuoteById(+params.id)
    return json({ data })
  },
})
