export default function ProductCard({ product, onAddToCart, onViewDetails, loading }) {
  const fallbackImage =
    "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=900&q=80";
  const imageUrl = product.image_url || fallbackImage;

  return (
    <article className="panel product-card">
      <img
        src={imageUrl}
        alt={product.name}
        className="product-image"
        onClick={onViewDetails}
        style={{ cursor: onViewDetails ? "pointer" : "default" }}
      />
      <div className="row-between">
        <strong
          onClick={onViewDetails}
          style={{
            cursor: onViewDetails ? "pointer" : "default",
            color: onViewDetails ? "#6f3b18" : "inherit",
            textDecoration: onViewDetails ? "underline" : "none",
          }}
        >
          {product.name}
        </strong>
        <span className="pill">{product.category}</span>
      </div>
      <p>{product.description || "Freshly prepared with premium ingredients."}</p>
      <div className="row-between">
        <span className="price">${Number(product.price).toFixed(2)}</span>
        {product.is_available ? (
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => onAddToCart(product.id)}
            disabled={loading}
          >
            Add to cart
          </button>
        ) : (
          <span className="pill">Unavailable</span>
        )}
      </div>
    </article>
  );
}
