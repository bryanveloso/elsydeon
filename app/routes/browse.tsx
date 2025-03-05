import { quotesQueryOptions } from '@app/utils/quotes'
import { queryOptions, useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import axios from 'redaxios'

export const Route = createFileRoute('/browse')({
  loader: async ({ context: { queryClient } }) => {
    await queryClient.ensureQueryData(quotesQueryOptions())
  },
  component: BrowseComponent,
})

function BrowseComponent() {
  const quotesQuery = useSuspenseQuery(quotesQueryOptions())

  return (
    <div>
      <div>Hello "/browse"!</div>
      <div>
        {[...quotesQuery.data].map(quote => {
          return <div>a quote goes here...</div>
        })}
      </div>
    </div>
  )
}
