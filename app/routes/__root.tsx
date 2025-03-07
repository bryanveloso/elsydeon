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
import { Footer } from '@app/components/Footer'

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()(
  {
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
  }
)

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
      <body className="bg-nebula-900 text-nebula-50 text-sans flex flex-col min-h-dvh">
        <main className="flex-1">{children}</main>
        <Footer />
        <Scripts />
      </body>
    </html>
  )
}
