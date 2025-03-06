// app/routes/index.tsx
import { createFileRoute, Link, useRouter } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { quoteService } from '@core/services/quote-service'

export const getQuoteStats = createServerFn({ method: 'GET' }).handler(
  async () => {
    const totalQuotes = await quoteService.getQuotesCount()

    // Get all unique years
    const years = await quoteService.getQuoteYears()
    const yearSpan =
      years.length > 0 ? years[years.length - 1] - years[0] + 1 : 0

    return { totalQuotes, yearSpan }
  }
)

export const Route = createFileRoute('/')({
  component: Home,
  loader: async () => {
    return getQuoteStats()
  },
})

function Home() {
  const router = useRouter()
  const state = Route.useLoaderData()

  return (
    <div>
      <h1 className="font-display text-2xl sm:text-6xl">
        Shit{' '}
        <span className="bg-gradient-to-br from-amber-300 to-emerald-300 bg-clip-text text-transparent">
          Crusaders
        </span>{' '}
        Say
      </h1>

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
          you&apos;re not alone. The people who said them can&apos;t make sense
          of them either.
        </p>
      </div>
      <div className="flex">
        <Link to="/browse">Browse the Library</Link>
        <Link to="/">Surprise Me</Link>
      </div>
      <div className=""></div>
    </div>
  )
}
