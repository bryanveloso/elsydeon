import { quoteService } from '@core/services/quote-service'
import { createFileRoute } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { format } from 'date-fns'

const getQuote = createServerFn({ method: 'GET' })
  .validator((d: number) => d)
  .handler(async ({ data }) => {
    const quote = await quoteService.getQuoteById(data)
    console.log(quote)
    return quote
  })

export const Route = createFileRoute('/quote/$id')({
  component: RouteComponent,
  loader: async ({ params: { id }, context }) => getQuote({ data: +id }),
})

function RouteComponent() {
  const quote = Route.useLoaderData()

  return (
    <div className="grid align-middle items-center h-screen">
      <div className="aspect-video mx-auto flex flex-col h-96 bg-green-800 p-8 rounded-lg">
        <div className="font-mono text-4xl flex-1">
          &lt;{quote?.quotee}&gt; {quote?.text}
        </div>
        <div className="flex">
          <div>
            Quote <strong>#{quote?.id}</strong>
          </div>
          <div>
            Recorded on the&nbsp;
            {quote?.timestamp
              ? format(new Date(quote?.timestamp), "do 'of' MMMM yyyy")
              : ''}
          </div>
          <div>&nbsp;by {quote?.quoter}</div>
        </div>
      </div>
    </div>
  )
}
