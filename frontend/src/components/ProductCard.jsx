export default function ProductCard({ product, onAddToCart, onViewDetails, loading }) {
  const fallbackImage =
    "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=900&q=80";
  const imageUrl = product.image_url || fallbackImage;

  return (
    <article className="group relative h-full">
      {/* Background gradient layers for depth */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-100/50 to-blue-100/50 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      <div className="relative bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 ease-out transform group-hover:-translate-y-2 border border-gray-100 flex flex-col h-full">

        {/* Image container with overlay */}
        <div className="relative overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 aspect-square">
          <img
            src={imageUrl}
            alt={product.name}
            className="w-full h-full object-cover cursor-pointer transition-transform duration-500 group-hover:scale-110"
            onClick={onViewDetails}
          />
          {/* Overlay on hover */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300" />

          {/* Category badge - positioned on image */}
          <span className="absolute top-3 right-3 inline-block px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-lg">
            {product.category}
          </span>
        </div>

        {/* Content section */}
        <div className="flex flex-col flex-1 p-5">

          {/* Product name */}
          <h3
            className="font-bold text-lg text-gray-900 mb-2 cursor-pointer hover:text-purple-600 transition-colors line-clamp-2"
            onClick={onViewDetails}
          >
            {product.name}
          </h3>

          {/* Description */}
          <p className="text-sm text-gray-600 line-clamp-2 mb-4 flex-1">
            {product.description || "Freshly prepared with premium ingredients."}
          </p>

          {/* Price and button section */}
          <div className="flex items-center justify-between gap-3 pt-4 border-t border-gray-100">
            <div className="flex flex-col">
              <span className="text-xs text-gray-500 font-medium">Price</span>
              <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-purple-700 bg-clip-text text-transparent">
                ${Number(product.price).toFixed(2)}
              </span>
            </div>

            {product.is_available ? (
              <button
                type="button"
                className="flex-1 btn-primary text-sm py-2 px-4 flex items-center justify-center gap-2 group/btn"
                onClick={() => onAddToCart(product.id)}
                disabled={loading}
              >
                <span>{loading ? "Adding..." : "Add"}</span>
                {!loading && <span className="text-lg group-hover/btn:translate-x-1 transition-transform">→</span>}
              </button>
            ) : (
              <div className="flex-1 px-4 py-2 rounded-lg bg-gray-100 text-gray-600 text-sm font-medium text-center">
                Out of Stock
              </div>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
