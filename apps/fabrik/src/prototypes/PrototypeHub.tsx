// Placeholder-hub for fabrik-prototyper.
// Tilføj nye prototyper ved at importere dem her og linke dem ind i listen.

export function PrototypeHub() {
  return (
    <div className="min-h-screen bg-page p-md">
      <div className="mx-auto max-w-3xl">
        <h1 className="font-poppins text-2xl text-deep-teal">Fabrik — Prototyper</h1>
        <p className="mt-xs text-sm text-text-muted">
          Ingen prototyper endnu. Tilføj din første prototype i{' '}
          <code className="rounded-sm bg-surface-2 px-xxs">src/prototypes/</code>.
        </p>
      </div>
    </div>
  )
}
