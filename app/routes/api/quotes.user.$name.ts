import { quoteService } from '@core/services/quote-service'
import { json } from '@tanstack/react-start'
import { createAPIFileRoute } from '@tanstack/react-start/api'

export const APIRoute = createAPIFileRoute('/api/quotes/user/$name')({
  GET: async ({ request, params }) => {
    const data = await quoteService.getQuotesByUser(params.name)
    console.log('data', data)
    return json(data)
  },
})
