import "./globals.css";
import type { Metadata } from "next";
import { Poppins } from 'next/font/google'
//import { Inter } from "next/font/google";
//import { Source_Sans_3 } from 'next/font/google'
//import { Open_Sans, Lato, Work_Sans, Fira_Sans, Noto_Serif } from 'next/font/google'

/*
	Serif
	Old-Style: Spectral, EB Garamond
	Transitional: Noto, Source Serif 4



	Sans-Serif
	
	Grotesque: Work Sans
	Geometric: DM Sans, Poppins
	Humanist: Merriweather Sans, Cabin, Source Sans 3
*/



const geometric = Poppins({
	subsets: ["latin"],
	weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"]
});
//const sans = Source_Sans_3({ subsets: ['latin'] });
//const sans = Lato({ subsets: ['latin'], weight: "400"});
//const sans = Open_Sans({ subsets: ['latin'] });
//const sans = Lato({ subsets: ['latin'], weight: "400"});
//const sans = Work_Sans({ subsets: ['latin'] });
//const sans = Fira_Sans({ subsets: ['latin'], weight: "400"});
//const sans = Noto_Serif({ subsets: ['latin']});



export const metadata: Metadata = {
	title: "Path Tracer",
	description: "A path tracer using WebGL",
};



export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en">
			<body className={geometric.className + " bg-slate-900"}>{children}</body>
		</html>
	);
}
