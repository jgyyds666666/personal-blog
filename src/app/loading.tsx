export default function Loading() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center px-6" role="status" aria-live="polite">
      <div className="flex items-center gap-3 text-sm text-[#78716c]">
        <span className="size-5 animate-spin rounded-full border-2 border-[#d6d3cb] border-t-[#b45309]" aria-hidden="true" />
        正在加载…
      </div>
    </div>
  );
}
