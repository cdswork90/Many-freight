import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {title:"Many Freight | Transportation Management",description:"Freight operations, dispatch, tracking, invoicing and compliance in one workspace."};
export default function RootLayout({children}:{children:React.ReactNode}) { return <html lang="en"><body>{children}</body></html>; }
