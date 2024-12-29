"use client";

import { Suspense } from 'react'
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Footer from "@/components/Footer";
import InstallPrompt from "@/components/InstallPrompt";

export default function Home() {
  return (
    <>
      <Suspense>
        <Header />
      </Suspense>
      <main>
        <InstallPrompt />
        <Hero />
      </main>
      <Footer />
    </>
  );
}