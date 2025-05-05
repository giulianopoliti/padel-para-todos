export default function SkeletonNavbar() {
  return (
    <div className="bg-padel-green-600 text-white shadow">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo placeholder */}
          <div className="h-8 w-32 bg-white/20 rounded animate-pulse"></div>
          
          {/* Navigation items placeholders */}
          <div className="flex space-x-4">
            <div className="h-8 w-20 bg-white/20 rounded animate-pulse"></div>
            <div className="h-8 w-24 bg-white/20 rounded animate-pulse"></div>
            <div className="ml-4 h-8 w-10 bg-white/20 rounded-full animate-pulse"></div>
          </div>
        </div>
      </div>
    </div>
  );
} 