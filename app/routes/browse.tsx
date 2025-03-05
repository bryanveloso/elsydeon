import { queryOptions, useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import axios from 'redaxios'

export interface Quote {
  id: number
  text: string
  quotee: string
  quoter: string
  year: number
  timestamp: string
}


export const Route = createFileRoute('/browse')({
  loader: async () => {
    return await axios
      .get<Array<Quote>>('http://localhost:3010/api/quotes/latest')
      .then(res => res.data)
      .catch(() => {
        throw new Error('Failed to fetch quotes')
      })
    },
  component: BrowseComponent,
})

function BrowseComponent() {
  const quotes = Route.useLoaderData()

  return (
    <div>
      <div>Hello "/browse"!</div>
      <div>
        {[
          ...quotes,
        ].map(quote => {
          return (
            <div>
              <div className="font-mono">
                <span className="text-zinc-200">
                  &lt;{quote.quotee}&gt;&nbsp;
                </span>
                {quote.quotee} {quote.text}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
