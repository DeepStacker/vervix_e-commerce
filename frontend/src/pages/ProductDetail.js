import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiHeart, FiShare2, FiStar, FiTruck, FiShield, FiRefreshCw, FiMinus, FiPlus, FiShoppingCart } from 'react-icons/fi';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import axios from 'axios';
import toast from 'react-hot-toast';

const ProductDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // State management
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [showSizeGuide, setShowSizeGuide] = useState(false);
  const [activeTab, setActiveTab] = useState('description');

  // Fetch product details
  const { data: product, isLoading, error } = useQuery(
    ['product', slug],
    async () => {
      const response = await axios.get(`/api/products/${slug}`);
      return response.data;
    },
    {
      onSuccess: (data) => {
        if (data.variants && data.variants.length > 0) {
          setSelectedVariant(data.variants[0]);
          setSelectedSize(data.variants[0].size);
          setSelectedColor(data.variants[0].color);
        }
      }
    }
  );

  // Fetch product reviews
  const { data: reviews } = useQuery(
    ['product-reviews', slug],
    async () => {
      const response = await axios.get(`/api/products/${slug}/reviews`);
      return response.data;
    }
  );

  // Mutations
  const addToCartMutation = useMutation(
    async (cartData) => {
      const response = await axios.post('/api/cart/add', cartData);
      return response.data;
    },
    {
      onSuccess: () => {
        toast.success('Added to cart successfully!');
        queryClient.invalidateQueries('cart');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to add to cart');
      }
    }
  );

  const addToWishlistMutation = useMutation(
    async (productId) => {
      const response = await axios.post('/api/users/wishlist', { productId });
      return response.data;
    },
    {
      onSuccess: () => {
        toast.success('Added to wishlist!');
      },
      onError: (error) => {
        toast.error('Failed to add to wishlist');
      }
    }
  );

  // Handle variant selection
  const handleVariantSelect = (size, color) => {
    const variant = product.variants.find(
      v => v.size === size && v.color === color
    );
    
    if (variant) {
      setSelectedVariant(variant);
      setSelectedSize(size);
      setSelectedColor(color);
    }
  };

  // Handle add to cart
  const handleAddToCart = () => {
    if (!selectedVariant) {
      toast.error('Please select a size and color');
      return;
    }

    if (selectedVariant.stock < quantity) {
      toast.error('Not enough stock available');
      return;
    }

    addToCartMutation.mutate({
      productId: product._id,
      variantId: selectedVariant._id,
      quantity: quantity
    });
  };

  // Handle quantity change
  const handleQuantityChange = (change) => {
    const newQuantity = quantity + change;
    if (newQuantity >= 1 && newQuantity <= (selectedVariant?.stock || 1)) {
      setQuantity(newQuantity);
    }
  };

  // Calculate average rating
  const averageRating = reviews?.reviews?.length > 0
    ? reviews.reviews.reduce((acc, review) => acc + review.rating, 0) / reviews.reviews.length
    : 0;

  if (isLoading) {
    return (
      <div className="section-padding">
        <div className="container-luxury">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="animate-pulse">
              <div className="bg-gray-200 h-96 rounded-lg mb-4"></div>
              <div className="flex gap-2">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="bg-gray-200 h-20 w-20 rounded-lg"></div>
                ))}
              </div>
            </div>
            <div className="space-y-4 animate-pulse">
              <div className="bg-gray-200 h-8 rounded w-3/4"></div>
              <div className="bg-gray-200 h-6 rounded w-1/2"></div>
              <div className="bg-gray-200 h-4 rounded w-full"></div>
              <div className="bg-gray-200 h-4 rounded w-2/3"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="section-padding">
        <div className="container-luxury">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-red-600 mb-4">Product Not Found</h2>
            <p className="text-warm-gray mb-6">{error.message}</p>
            <button
              onClick={() => navigate('/products')}
              className="bg-luxury-gold text-white px-6 py-3 rounded-lg hover:bg-luxury-gold-dark transition-colors"
            >
              Back to Products
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!product) return null;

  const images = selectedVariant?.images?.length > 0 
    ? selectedVariant.images 
    : product.images;

  return (
    <div className="section-padding bg-luxury-cream">
      <div className="container-luxury">
        {/* Breadcrumb */}
        <nav className="mb-8">
          <ol className="flex items-center space-x-2 text-sm text-warm-gray">
            <li>
              <button onClick={() => navigate('/')} className="hover:text-luxury-gold">
                Home
              </button>
            </li>
            <li>/</li>
            <li>
              <button onClick={() => navigate('/products')} className="hover:text-luxury-gold">
                Products
              </button>
            </li>
            <li>/</li>
            <li className="text-gray-900">{product.name}</li>
          </ol>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Product Images */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            {/* Main Image */}
            <div className="relative bg-white rounded-lg overflow-hidden">
              <img
                src={images[activeImage]?.url || '/placeholder-product.jpg'}
                alt={product.name}
                className="w-full h-96 object-cover"
              />
              <button
                onClick={() => addToWishlistMutation.mutate(product._id)}
                className="absolute top-4 right-4 p-2 bg-white rounded-full shadow-sm hover:bg-luxury-gold hover:text-white transition-colors"
              >
                <FiHeart size={20} />
              </button>
              <button
                onClick={() => navigator.share?.({ title: product.name, url: window.location.href })}
                className="absolute top-4 left-4 p-2 bg-white rounded-full shadow-sm hover:bg-luxury-gold hover:text-white transition-colors"
              >
                <FiShare2 size={20} />
              </button>
            </div>

            {/* Thumbnail Images */}
            {images.length > 1 && (
              <div className="flex gap-2">
                {images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setActiveImage(index)}
                    className={`w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors ${
                      index === activeImage 
                        ? 'border-luxury-gold' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <img
                      src={image.url}
                      alt={`${product.name} ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </motion.div>

          {/* Product Info */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            {/* Product Title and Brand */}
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.name}</h1>
              <p className="text-lg text-warm-gray mb-4">by {product.brand}</p>
              
              {/* Rating */}
              <div className="flex items-center gap-2 mb-4">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <FiStar
                      key={i}
                      className={`w-5 h-5 ${
                        i < Math.floor(averageRating)
                          ? 'text-yellow-400 fill-current'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm text-warm-gray">
                  ({reviews?.reviews?.length || 0} reviews)
                </span>
              </div>
            </div>

            {/* Price */}
            <div className="flex items-center gap-4">
              <span className="text-3xl font-bold text-gray-900">
                ${selectedVariant?.price || product.price}
              </span>
              {selectedVariant?.comparePrice && (
                <span className="text-xl text-warm-gray line-through">
                  ${selectedVariant.comparePrice}
                </span>
              )}
              {selectedVariant?.comparePrice && (
                <span className="bg-red-500 text-white px-2 py-1 rounded text-sm font-medium">
                  {Math.round(((selectedVariant.comparePrice - selectedVariant.price) / selectedVariant.comparePrice) * 100)}% OFF
                </span>
              )}
            </div>

            {/* Variant Selection */}
            {product.variants && product.variants.length > 0 && (
              <div className="space-y-4">
                {/* Color Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Color: {selectedColor}
                  </label>
                  <div className="flex gap-2">
                    {[...new Set(product.variants.map(v => v.color))].map(color => (
                      <button
                        key={color}
                        onClick={() => setSelectedColor(color)}
                        className={`w-8 h-8 rounded-full border-2 transition-colors ${
                          selectedColor === color
                            ? 'border-luxury-gold'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                        style={{ backgroundColor: color.toLowerCase() }}
                        title={color}
                      />
                    ))}
                  </div>
                </div>

                {/* Size Selection */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Size: {selectedSize}
                    </label>
                    <button
                      onClick={() => setShowSizeGuide(!showSizeGuide)}
                      className="text-sm text-luxury-gold hover:underline"
                    >
                      Size Guide
                    </button>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {[...new Set(product.variants.map(v => v.size))].map(size => {
                      const variant = product.variants.find(v => v.size === size && v.color === selectedColor);
                      const isAvailable = variant && variant.stock > 0;
                      
                      return (
                        <button
                          key={size}
                          onClick={() => setSelectedSize(size)}
                          disabled={!isAvailable}
                          className={`px-4 py-2 border rounded-lg transition-colors ${
                            selectedSize === size
                              ? 'border-luxury-gold bg-luxury-gold text-white'
                              : isAvailable
                                ? 'border-gray-300 hover:border-luxury-gold'
                                : 'border-gray-200 text-gray-400 cursor-not-allowed'
                          }`}
                        >
                          {size}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Stock Status */}
                {selectedVariant && (
                  <div className="text-sm">
                    {selectedVariant.stock > 0 ? (
                      <span className="text-green-600">
                        In Stock ({selectedVariant.stock} available)
                      </span>
                    ) : (
                      <span className="text-red-600">Out of Stock</span>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Quantity and Add to Cart */}
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <label className="text-sm font-medium text-gray-700">Quantity:</label>
                <div className="flex items-center border border-gray-300 rounded-lg">
                  <button
                    onClick={() => handleQuantityChange(-1)}
                    disabled={quantity <= 1}
                    className="p-2 hover:bg-gray-100 disabled:opacity-50"
                  >
                    <FiMinus size={16} />
                  </button>
                  <span className="px-4 py-2 min-w-[60px] text-center">{quantity}</span>
                  <button
                    onClick={() => handleQuantityChange(1)}
                    disabled={quantity >= (selectedVariant?.stock || 1)}
                    className="p-2 hover:bg-gray-100 disabled:opacity-50"
                  >
                    <FiPlus size={16} />
                  </button>
                </div>
              </div>

              <button
                onClick={handleAddToCart}
                disabled={!selectedVariant || selectedVariant.stock === 0 || addToCartMutation.isLoading}
                className="w-full bg-luxury-gold text-white py-4 px-6 rounded-lg hover:bg-luxury-gold-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <FiShoppingCart size={20} />
                {addToCartMutation.isLoading ? 'Adding...' : 'Add to Cart'}
              </button>
            </div>

            {/* Features */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6 border-t border-gray-200">
              <div className="flex items-center gap-2 text-sm">
                <FiTruck className="text-luxury-gold" />
                <span>Free Shipping</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <FiShield className="text-luxury-gold" />
                <span>Secure Payment</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <FiRefreshCw className="text-luxury-gold" />
                <span>Easy Returns</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Product Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-16"
        >
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8">
              {['description', 'specifications', 'reviews'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm capitalize ${
                    activeTab === tab
                      ? 'border-luxury-gold text-luxury-gold'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </nav>
          </div>

          <div className="py-8">
            <AnimatePresence mode="wait">
              {activeTab === 'description' && (
                <motion.div
                  key="description"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="prose max-w-none"
                >
                  <div dangerouslySetInnerHTML={{ __html: product.description }} />
                </motion.div>
              )}

              {activeTab === 'specifications' && (
                <motion.div
                  key="specifications"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="grid grid-cols-1 md:grid-cols-2 gap-6"
                >
                  <div>
                    <h3 className="font-semibold mb-4">Product Details</h3>
                    <dl className="space-y-2">
                      <div className="flex justify-between">
                        <dt className="text-gray-600">Brand</dt>
                        <dd className="font-medium">{product.brand}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-600">Category</dt>
                        <dd className="font-medium">{product.category?.name}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-600">SKU</dt>
                        <dd className="font-medium">{product.sku}</dd>
                      </div>
                    </dl>
                  </div>
                  {selectedVariant && (
                    <div>
                      <h3 className="font-semibold mb-4">Variant Details</h3>
                      <dl className="space-y-2">
                        <div className="flex justify-between">
                          <dt className="text-gray-600">Size</dt>
                          <dd className="font-medium">{selectedVariant.size}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-gray-600">Color</dt>
                          <dd className="font-medium">{selectedVariant.color}</dd>
                        </div>
                        {selectedVariant.material && (
                          <div className="flex justify-between">
                            <dt className="text-gray-600">Material</dt>
                            <dd className="font-medium">{selectedVariant.material}</dd>
                          </div>
                        )}
                      </dl>
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === 'reviews' && (
                <motion.div
                  key="reviews"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <div className="mb-6">
                    <h3 className="text-xl font-semibold mb-2">Customer Reviews</h3>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <FiStar
                            key={i}
                            className={`w-5 h-5 ${
                              i < Math.floor(averageRating)
                                ? 'text-yellow-400 fill-current'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-lg font-medium">{averageRating.toFixed(1)}</span>
                      <span className="text-warm-gray">({reviews?.reviews?.length || 0} reviews)</span>
                    </div>
                  </div>

                  {reviews?.reviews?.length > 0 ? (
                    <div className="space-y-6">
                      {reviews.reviews.map((review) => (
                        <div key={review._id} className="border-b border-gray-200 pb-6">
                          <div className="flex items-center gap-4 mb-2">
                            <div className="flex items-center">
                              {[...Array(5)].map((_, i) => (
                                <FiStar
                                  key={i}
                                  className={`w-4 h-4 ${
                                    i < review.rating
                                      ? 'text-yellow-400 fill-current'
                                      : 'text-gray-300'
                                  }`}
                                />
                              ))}
                            </div>
                            <span className="font-medium">{review.user?.firstName} {review.user?.lastName}</span>
                            <span className="text-sm text-warm-gray">
                              {new Date(review.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-gray-700">{review.comment}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-warm-gray">No reviews yet. Be the first to review this product!</p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ProductDetail; 