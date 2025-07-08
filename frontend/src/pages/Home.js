import React from 'react';
import { Helmet } from 'react-helmet-async';

const Home = () => {
  return (
    <>
      <Helmet>
        <title>Vervix - Luxury Fashion Destination</title>
        <meta 
          name="description" 
          content="Discover exclusive luxury fashion collections at Vervix. Premium clothing for men, women, and unisex styles with exceptional quality and design." 
        />
      </Helmet>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="container-luxury text-center">
          <h1 className="hero-title animate-fade-in-up">
            VERVIX
          </h1>
          <p className="hero-subtitle animate-fade-in-up stagger-1">
            Where Luxury Meets Style
          </p>
          <p className="text-lg text-gray-300 mb-12 max-w-2xl mx-auto animate-fade-in-up stagger-2">
            Discover our curated collection of premium fashion that defines elegance and sophistication. 
            Experience the finest in luxury clothing and accessories.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up stagger-3">
            <button className="btn-luxury-gold hover-lift">
              Explore Collection
            </button>
            <button className="btn-luxury-outline hover-lift">
              Learn More
            </button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="section-padding bg-soft-cream">
        <div className="container-luxury">
          <div className="text-center mb-16">
            <h2 className="section-title animate-fade-in-up">
              Why Choose Vervix
            </h2>
            <p className="section-subtitle animate-fade-in-up stagger-1">
              Experience luxury fashion with unmatched quality and service
            </p>
          </div>

          <div className="grid-categories">
            <div className="card-luxury text-center animate-fade-in-up stagger-1 hover-lift">
              <div className="w-16 h-16 bg-luxury-gold rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              </div>
              <h3 className="text-xl font-playfair font-semibold mb-4">Premium Quality</h3>
              <p className="text-warm-gray">
                Carefully curated selection of the finest materials and craftsmanship 
                from renowned luxury brands worldwide.
              </p>
            </div>

            <div className="card-luxury text-center animate-fade-in-up stagger-2 hover-lift">
              <div className="w-16 h-16 bg-luxury-gold rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-playfair font-semibold mb-4">Fast Delivery</h3>
              <p className="text-warm-gray">
                Express shipping options available with secure packaging 
                to ensure your luxury items arrive in perfect condition.
              </p>
            </div>

            <div className="card-luxury text-center animate-fade-in-up stagger-3 hover-lift">
              <div className="w-16 h-16 bg-luxury-gold rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-playfair font-semibold mb-4">Expert Service</h3>
              <p className="text-warm-gray">
                Personalized styling advice and dedicated customer support 
                to help you find the perfect luxury pieces for your wardrobe.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Collection Preview */}
      <section className="section-padding">
        <div className="container-luxury">
          <div className="text-center mb-16">
            <h2 className="section-title animate-fade-in-up">
              Featured Collections
            </h2>
            <p className="section-subtitle animate-fade-in-up stagger-1">
              Explore our latest luxury fashion pieces
            </p>
          </div>

          <div className="grid-categories">
            <div className="relative overflow-hidden rounded-lg shadow-luxury hover-scale animate-fade-in-up stagger-1">
              <div className="h-96 bg-gradient-to-br from-primary-black to-secondary-black flex items-center justify-center">
                <div className="text-center text-white">
                  <h3 className="font-playfair text-2xl font-bold mb-2">Men's Collection</h3>
                  <p className="text-luxury-gold">Sophisticated & Timeless</p>
                </div>
              </div>
              <div className="absolute inset-0 bg-black bg-opacity-20 hover:bg-opacity-10 transition-all duration-300"></div>
            </div>

            <div className="relative overflow-hidden rounded-lg shadow-luxury hover-scale animate-fade-in-up stagger-2">
              <div className="h-96 bg-gradient-to-br from-luxury-gold to-warm-gold flex items-center justify-center">
                <div className="text-center text-white">
                  <h3 className="font-playfair text-2xl font-bold mb-2">Women's Collection</h3>
                  <p className="text-primary-black">Elegant & Refined</p>
                </div>
              </div>
              <div className="absolute inset-0 bg-black bg-opacity-10 hover:bg-opacity-0 transition-all duration-300"></div>
            </div>

            <div className="relative overflow-hidden rounded-lg shadow-luxury hover-scale animate-fade-in-up stagger-3">
              <div className="h-96 bg-gradient-to-br from-warm-gray to-light-gray flex items-center justify-center">
                <div className="text-center text-primary-black">
                  <h3 className="font-playfair text-2xl font-bold mb-2">Unisex Collection</h3>
                  <p className="text-luxury-gold">Modern & Versatile</p>
                </div>
              </div>
              <div className="absolute inset-0 bg-black bg-opacity-5 hover:bg-opacity-0 transition-all duration-300"></div>
            </div>
          </div>

          <div className="text-center mt-12">
            <button className="btn-luxury hover-lift animate-fade-in-up stagger-4">
              View All Collections
            </button>
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="section-padding bg-primary-black text-white">
        <div className="container-luxury">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="font-playfair text-4xl font-bold mb-4 text-luxury-gold animate-fade-in-up">
              Stay in Style
            </h2>
            <p className="text-lg mb-8 text-gray-300 animate-fade-in-up stagger-1">
              Subscribe to our newsletter for exclusive access to new collections, 
              special offers, and luxury fashion insights.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 max-w-lg mx-auto animate-fade-in-up stagger-2">
              <input
                type="email"
                placeholder="Enter your email address"
                className="input-luxury flex-1 text-primary-black"
              />
              <button className="btn-luxury-gold hover-lift">
                Subscribe
              </button>
            </div>
            <p className="text-sm text-gray-400 mt-4 animate-fade-in-up stagger-3">
              We respect your privacy. Unsubscribe at any time.
            </p>
          </div>
        </div>
      </section>
    </>
  );
};

export default Home;
