import { createRootRoute, HeadContent, Outlet, Scripts } from '@tanstack/react-router'
import appCss from '~/styles/app.css?url'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'Petlio — Serviços completos para pets, tudo em um só lugar' },
      {
        name: 'description',
        content:
          'Petlio conecta você a passeadores, veterinários, pet sitters, transporte e pet shops perto de você. Cadastre seu pet, agende e acompanhe tudo em um só app.',
      },
    ],
    links: [
      { rel: 'stylesheet', href: appCss },
      { rel: 'icon', href: '/favicon.svg' },
      {
        rel: 'stylesheet',
        href: 'https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&family=Inter:wght@400;500;600;700;800&display=swap',
      },
    ],
  }),
  component: RootComponent,
})

function RootComponent() {
  return (
    <html lang="pt-BR">
      <head>
        <HeadContent />
      </head>
      <body className="texture-noise">
        <Outlet />
        <Scripts />
      </body>
    </html>
  )
}
