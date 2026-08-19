export default function Loading() {
  return (
    <div className="mx-auto max-w-4xl animate-pulse px-6 py-12" aria-label="正在加载">
      <div className="mx-auto my-12 h-28 max-w-lg rounded-2xl bg-[#eeeae3] md:my-20" />
      <div className="mx-auto mb-10 h-11 max-w-xl rounded-full bg-[#eeeae3]" />
      <div className="space-y-7">
        {[0, 1, 2].map((item) => <div key={item} className="space-y-3 border-b border-[#e7e2d8] pb-7"><div className="h-3 w-28 rounded bg-[#eeeae3]" /><div className="h-6 w-2/3 rounded bg-[#e7e2d8]" /><div className="h-4 w-full rounded bg-[#f0ede7]" /></div>)}
      </div>
    </div>
  );
}
