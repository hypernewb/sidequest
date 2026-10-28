import type { Metadata } from 'next';
import 'leaflet/dist/leaflet.css';
import './globals.css';
export const metadata: Metadata={title:'SideQuest — Catch it while it’s here',description:'Discover limited events, pop-ups, online listening parties and timed drops connected to your taste. Powered by Qloo and official sources.',icons:{icon:'/favicon.svg'}};
export default function RootLayout({children}:Readonly<{children:React.ReactNode}>){return <html lang="en"><body>{children}</body></html>;}
