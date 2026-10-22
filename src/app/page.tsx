export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-background text-foreground">
      <div className="max-w-md w-full p-8 rounded-2xl border border-border bg-surface shadow-xs text-center space-y-4">
        <div className="w-12 h-12 mx-auto rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg">
          M4
        </div>
        <h1 className="text-2xl font-bold font-heading text-foreground">
          Araya Business Hub — Modul 4
        </h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Project setup selesai. Siap untuk implementasi fitur Penawaran &amp; Tagihan Penjualan.
        </p>
      </div>
    </main>
  );
}
