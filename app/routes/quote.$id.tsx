import { quoteService } from '@core/services/quote-service'
import { createFileRoute, Link } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { format } from 'date-fns'

const getQuote = createServerFn({ method: 'GET' })
  .validator((d: number) => d)
  .handler(async ({ data }) => {
    const quotes = await quoteService.getAdjacentQuotes(data)
    return quotes
  })

export const Route = createFileRoute('/quote/$id')({
  component: RouteComponent,
  loader: async ({ params: { id }, context }) => getQuote({ data: +id }),
})

function RouteComponent() {
  const { current: quote, previous, next } = Route.useLoaderData()

  if (!quote) {
    return <div>Quote not found</div>
  }

  return (
    <div className="grid align-middle items-center h-dvh">
      <div className="mx-auto flex flex-col max-w-3xl w-full gap-4">
        {/* Current Quote */}
        <div className="flex flex-col h-96 bg-green-800 p-8 rounded-lg">
          <div className="font-mono text-4xl flex-1">
            &lt;{quote.quotee}&gt; {quote.text}
          </div>
          <div className="flex flex-wrap gap-2 justify-between items-center">
            <div>
              Quote <strong>#{quote.id}</strong>
            </div>
            <div>
              Recorded on the&nbsp;
              {quote.timestamp
                ? format(new Date(quote.timestamp), "do 'of' MMMM yyyy")
                : ''}
              &nbsp;by {quote.quoter}
            </div>
          </div>
        </div>
        
        {/* Navigation */}
        <div className="flex justify-between">
          <div>
            {previous && (
              <Link
                to="/quote/$id"
                params={{ id: previous.id.toString() }}
                className="p-2 px-4 bg-gray-800 rounded hover:bg-gray-700"
              >
                &larr; Previous Quote
              </Link>
            )}
          </div>
          <Link
            to="/browse"
            className="p-2 px-4 bg-gray-800 rounded hover:bg-gray-700"
          >
            All Quotes
          </Link>
          <div>
            {next && (
              <Link
                to="/quote/$id"
                params={{ id: next.id.toString() }}
                className="p-2 px-4 bg-gray-800 rounded hover:bg-gray-700"
              >
                Next Quote &rarr;
              </Link>
            )}
          </div>
        </div>
        
        {/* Preview Cards */}
        <div className="flex gap-4 justify-between">
          {previous && (
            <div className="flex-1 p-4 bg-gray-800 rounded-lg overflow-hidden">
              <h3 className="text-gray-400 font-bold">Previous Quote #{previous.id}</h3>
              <p className="text-sm truncate">
                &lt;{previous.quotee}&gt; {previous.text}
              </p>
            </div>
          )}
          {next && (
            <div className="flex-1 p-4 bg-gray-800 rounded-lg overflow-hidden">
              <h3 className="text-gray-400 font-bold">Next Quote #{next.id}</h3>
              <p className="text-sm truncate">
                &lt;{next.quotee}&gt; {next.text}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
