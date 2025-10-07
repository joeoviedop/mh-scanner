export default function Footer() {
  return (
    <footer className="w-full border-t border-slate-200 bg-white/80">
      <div className="mx-auto max-w-6xl px-4 py-4 text-center text-sm text-slate-500">
        © {new Date().getFullYear()} VoyBien — Internal Tool
      </div>
    </footer>
  );
}
