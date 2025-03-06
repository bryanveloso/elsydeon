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
    queryFn: async () => {
      try {
        console.log('Fetching quotes from API...')
        // Try the random endpoint instead of latest
        const res = await axios.get<Quote[]>('/api/quotes/random')
        console.log('Quotes fetched successfully:', res.data.length)
        return res.data
      } catch (error) {
        console.error('Failed to fetch quotes:', error)
        throw new Error('Failed to fetch quotes')
      }
    },
  })
