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
    <div className="md:pt-12">
      {/* Random Quote Display */}
      {quote && (
        <div className="mb-6 h-64 md:mx-6">
          <div className="max-w-2xl m-auto p-8 flex flex-col h-full border border-nebula-700 rounded-2xl">
            <div className="font-mono text-2xl flex-1">
              <Link
                to="/quote/$id"
                params={{ id: quote.id.toString() }}
                className="text-sunbeam-300 hover:text-ocean-300 underline-offset-6 underline decoration-wavy"
              >
                #{quote.id}
              </Link>
              : &lt;{quote.quotee}&gt; {quote.text}
            </div>
            <div className="flex justify-between items-center text-sm text-gray-400">
              <div>
                <Link
                  to="/quote/$id"
                  params={{ id: quote.id.toString() }}
                  className="text-ocean-300"
                >
                  {new Date(quote.timestamp).toLocaleDateString()}
                </Link>
              </div>
              <button
                onClick={refreshQuote}
                disabled={isLoading}
                className="border-sunbeam-300 text-sunbeam-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <span className="text-xl -mt-1">↻</span>
                <span>Give me another!</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="text-3xl md:text-5xl">
        <div className="max-w-2xl m-auto flex items-center gap-2">
          <div>
            <img src={SHAKE} className="size-16 md:size-24 md:-ml-1.5" />
          </div>
          <div>
            <h1 className="font-display leading-snug">
              Shit{' '}
              <span className="bg-gradient-to-br from-sunbeam-300 to-sprout-500 bg-clip-text text-transparent">
                Crusaders
              </span>{' '}
              Say
            </h1>
            <div className="-mt-5 md:-mt-9">
              <span className="text-xs text-nebula-500">
                A collection of &ldquo;moments&rdquo; by Avalonstar's Crusaders.
              </span>
            </div>
          </div>
        </div>
      </div>

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
              <div key={recentQuote.id}>
                <div className="font-mono text-sm">
                  <Link
                    to="/quote/$id"
                    params={{ id: recentQuote.id.toString() }}
                    className="text-amber-300 hover:underline"
                  >
                    #{recentQuote.id}
                  </Link>
                  : &lt;{recentQuote.quotee}&gt; {recentQuote.text}
                </div>
                <div className="flex justify-between text-xs text-gray-400 mt-2">
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
