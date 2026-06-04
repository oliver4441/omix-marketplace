function ProductCard({ listing }) {
  return (
    <a href={`listing.html?id=${listing.id}`} className="block group">
      <div className="bg-zinc-100 dark:bg-zinc-900 rounded-2xl overflow-hidden aspect-square mb-3 relative border border-zinc-200/50 dark:border-zinc-800/50 transition-all group-hover:shadow-xl group-hover:border-[#ff385c]/30">
        <img src={listing.image} alt={listing.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" loading="lazy" />
        <div className="absolute top-3 left-3 bg-white/80 dark:bg-black/80 backdrop-blur-md text-zinc-900 dark:text-white px-3 py-1 rounded-full text-[10px] uppercase tracking-wider font-black shadow-sm border border-white/20">
          {listing.condition}
        </div>
      </div>
      <div className="px-1">
        <div className="flex justify-between items-start gap-2 mb-0.5">
          <h3 className="font-bold text-zinc-900 dark:text-white truncate group-hover:text-[#ff385c] transition-colors">{listing.title}</h3>
        </div>
        <div className="flex items-center gap-1.5 text-zinc-400 dark:text-zinc-500 text-xs mb-2">
          <div className="icon-map-pin text-[10px]"></div>
          <span>{listing.location}</span>
          <span className="text-zinc-300 dark:text-zinc-700">•</span>
          <span>{listing.category}</span>
        </div>
        <p className="font-extrabold text-[#ff385c] text-lg">{formatKES(listing.price)}</p>
      </div>
    </a>
  );
}