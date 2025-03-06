// app/routes/index.tsx
import { useState } from 'react'
import { createFileRoute, Link, useRouter } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { quoteService } from '@core/services/quote-service'

import SHAKE from '@app/assets/images/shake.gif'

export const getHomeData = createServerFn({ method: 'GET' }).handler(
  async () => {
    const totalQuotes = await quoteService.getQuotesCount()

    // Get all unique years
    const years = await quoteService.getQuoteYears()
    const yearSpan =
      years.length > 0 ? years[years.length - 1] - years[0] + 1 : 0

    const randomQuote = await quoteService.getRandomQuote()

    // Get latest 5 quotes
    const recentQuotes = await quoteService.getRecentQuotes(5)

    return { totalQuotes, yearSpan, randomQuote, recentQuotes }
  }
)

export const getRandomQuote = createServerFn({ method: 'GET' }).handler(
  async () => {
    const randomQuote = await quoteService.getRandomQuote()
    return { randomQuote }
  }
)

export const Route = createFileRoute('/')({
  component: Home,
  loader: async () => {
    return getHomeData()
  },
})

function Home() {
  const router = useRouter()
  const state = Route.useLoaderData()
  const [quote, setQuote] = useState(state.randomQuote)
  const [isLoading, setIsLoading] = useState(false)

  const refreshQuote = async () => {
    setIsLoading(true)
    try {
      const result = await getRandomQuote()
      setQuote(result.randomQuote)
    } catch (error) {
      console.error('Failed to fetch random quote:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div>
      <h1 className="font-display text-2xl sm:text-6xl">
        <div>
          <img src={SHAKE} className="size-16" />
        </div>
        Shit{' '}
        <span className="bg-gradient-to-br from-amber-300 to-emerald-300 bg-clip-text text-transparent">
          Crusaders
        </span>{' '}
        Say
      </h1>

      {/* Random Quote Display */}
      {quote && (
        <div className="my-6 bg-gray-800 p-4 sm:rounded-lg shadow h-36">
          <div className="max-w-2xl m-auto">
            <div className="font-mono mb-2 text-2xl">
              &lt;{quote.quotee}&gt; {quote.text}
            </div>
            <div className="flex justify-between text-sm text-gray-400">
              <Link
                to="/quote/$id"
                params={{ id: quote.id.toString() }}
                className="text-amber-300 hover:underline"
              >
                Quote #{quote.id}
              </Link>
              <button
                onClick={refreshQuote}
                disabled={isLoading}
                className="text-amber-300 hover:underline disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
              >
                {isLoading ? 'Loading...' : 'Give me another!'}
                {!isLoading && <span className="text-lg">↻</span>}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-2xl m-auto">
        <h2>
          Excuse me, <span className="font-display">what</span>?
        </h2>
        <div>
          <p className="text-balance">
            Enshrined here are a total of {state.totalQuotes} quotes spanning{' '}
            {state.yearSpan} years, chronicling the on-topic quips of a single
            community of nerds and gamers, turning those moments upside down by
            having the context viscerally ripped out of them.
          </p>
          <p className="text-balance">
            If you&apos;re having trouble trying to make sense of any of this,
            you&apos;re not alone. The people who said them can&apos;t make
            sense of them either.
          </p>
        </div>

        <div className="mt-8">
          <h2 className="text-xl mb-4">Recent Regrets</h2>
          <div className="space-y-3">
            {state.recentQuotes.map(recentQuote => (
              <div key={recentQuote.id} className="bg-gray-800/50 p-3 rounded">
                <div className="font-mono text-sm">
                  &lt;{recentQuote.quotee}&gt; {recentQuote.text}
                </div>
                <div className="flex justify-between text-xs text-gray-400 mt-2">
                  <Link
                    to="/quote/$id"
                    params={{ id: recentQuote.id.toString() }}
                    className="text-amber-300 hover:underline"
                  >
                    Quote #{recentQuote.id}
                  </Link>
                  <span>
                    {new Date(recentQuote.timestamp).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 flex justify-center">
            <Link
              to="/browse"
              className="px-4 py-2 bg-gray-800 rounded hover:bg-gray-700 transition"
            >
              Browse All Quotes
            </Link>
          </div>
        </div>
      </div>

      <div className="mb-20">
        Interested in seeing what gets quoted next? Then make your way over to
        avalonstar.tv, hit that follow button and make your way back when
        Avalonstar&apos;s live!
      </div>
    </div>
  )
}
