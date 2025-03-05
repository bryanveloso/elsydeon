// app/routes/__root.tsx
import type { ReactNode } from 'react'
import {
  Outlet,
  createRootRouteWithContext,
  HeadContent,
  Scripts,
} from '@tanstack/react-router'
import type { QueryClient } from '@tanstack/react-query'

import { DefaultCatchBoundary } from '../components/DefaultCatchBoundary'

import '@fontsource/courier-prime'
import '@fontsource/geist-sans'
import '@fontsource/yeseva-one'

import CSS from '../assets/styles.css?url'

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: `Shit Crusaders Say | bash.org for Avalonstar's Crusaders`,
      },
    ],
    links: [{ rel: 'stylesheet', href: CSS }],
  }),
  errorComponent: props => {
    return (
      <RootDocument>
        <DefaultCatchBoundary {...props} />
      </RootDocument>
    )
  },
  component: RootComponent,
})

function RootComponent() {
  return (
    <RootDocument>
      <Outlet />
    </RootDocument>
  )
}

function RootDocument({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html>
      <head>
        <HeadContent />
      </head>
      <body className="bg-zinc-950 text-zinc-50">
        <main>{children}</main>
        <Scripts />
      </body>
    </html>
  )
}
