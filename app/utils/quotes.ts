import { queryOptions } from '@tanstack/react-query'
import axios from 'redaxios'

export interface Quote {
  id: number
  text: string
  quotee: string
  quoter: string
  year: number
  timestamp: string
}

export const quotesQueryOptions = () =>
  queryOptions<Quote[]>({
    queryKey: ['quotes'],
    queryFn: () =>
      axios
        .get<Quote[]>('http://localhost:3010/api/quotes/latest')
        .then(res => res.data)
        .catch(() => {
          throw new Error('Failed to fetch quotes')
        }),
  })
