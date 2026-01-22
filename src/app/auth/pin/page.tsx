import { Suspense } from "react";
import PinClient from "./pin-client";

export default function PinPage() {
  return (
    <Suspense
      fallback={<div className="container stack">Loading PIN challenge...</div>}
    >
      <PinClient />
    </Suspense>
  );
}
