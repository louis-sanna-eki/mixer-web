import { GenerativeRadio } from "@/components/GenerativeRadio";
import { ToastProvider } from "@/components/ui/toast";
import { Toaster } from "@/components/ui/toaster";
import Head from "next/head";

export default function Home() {
  return (
    <>
      <ToastProvider>
        <GenerativeRadio />
        <Toaster />
      </ToastProvider>
    </>
  );
}
