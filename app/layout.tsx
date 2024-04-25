import { ReactNode } 
                     from 'react'
import { Metadata }  from 'next'
import './styles/globals.scss'

export type LayoutProps = {
   children: ReactNode
}

const name = process.env.NODE_HOST || '**';

export const metadata: Metadata = {
   title: {
     template: `${name}:%s | Helpful Scripts`,
     default:  'Helpful Scripts'
   },
}

export default async function RootLayout({children}: LayoutProps) {
   return <html lang="en">
      <head />
      <body>
         {children}
      </body>
   </html>
}
