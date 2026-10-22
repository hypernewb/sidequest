import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata={title:'SideQuest — Tokyo, a little differently',description:'Turn the things you love into somewhere worth going. Taste-led Tokyo discovery, powered by Qloo.',icons:{icon:'/favicon.svg'}};
export default function RootLayout({children}:Readonly<{children:React.ReactNode}>){return <html lang="en"><body>{children}</body></html>;}
