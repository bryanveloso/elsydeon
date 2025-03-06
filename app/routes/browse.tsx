import { createFileRoute, Link } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { quoteService } from '@core/services/quote-service'

export const getQuotes = createServerFn({ method: 'GET' }).handler(async () => {
  const quotes = await quoteService.getLatestQuotes(25)
  return quotes
})

export const Route = createFileRoute('/browse')({
  component: BrowseComponent,
  loader: async () => {
    return getQuotes()
  },
})

function BrowseComponent() {
  const quotes = Route.useLoaderData()

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Quote Library</h1>
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {quotes.map(quote => (
          <div
            key={quote.id}
            className="bg-gray-800 p-4 rounded-lg shadow flex flex-col"
          >
            <div className="font-mono mb-2 flex-1">
              &lt;{quote.quotee}&gt; {quote.text}
            </div>
            <div className="flex justify-between text-sm text-gray-400 mt-2">
              <Link
                to="/quote/$id"
                params={{ id: quote.id.toString() }}
                className="text-amber-300 hover:underline"
              >
                Quote #{quote.id}
              </Link>
              <span>{new Date(quote.timestamp).getFullYear()}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
