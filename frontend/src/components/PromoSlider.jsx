// code in this file is written by worapol สุดหล่อ
import React, { useState, useEffect } from 'react';

const PromoSlider = ({ products, navigate }) => {
  // Use products with discounts or low stock as "Recommended/Best Sellers" - by worapol สุดหล่อ
  let promoProducts = products?.filter(p => p.discount_percent > 0 || p.stock < 20) || [];
  if (promoProducts.length < 4) {
    promoProducts = [...promoProducts, ...(products || [])];
  }
  promoProducts = promoProducts.slice(0, 4); // force 4 faces for the 3D cube - by worapol สุดหล่อ

  const [current, setCurrent] = useState(0);
  const [transitionTime, setTransitionTime] = useState(0.8);

  useEffect(() => {
    if (promoProducts.length <= 1) return;
    const timer = setInterval(() => {
      setTransitionTime(0.8);
      setCurrent((prev) => prev - 1);
    }, 5000);
    return () => clearInterval(timer);
  }, [promoProducts.length]);

  const nextSlide = (e) => {
    e.stopPropagation();
    setTransitionTime(0.8);
    setCurrent((prev) => prev - 1);
  };

  const prevSlide = (e) => {
    e.stopPropagation();
    setTransitionTime(0.8);
    setCurrent((prev) => prev + 1);
  };

  if (!promoProducts || promoProducts.length < 4) return null;

  const activeIdx = ((current % 4) + 4) % 4;

  return (
    <div className="promo-slider-container featured-card cube-system">
      <div 
        className="promo-cube" 
        style={{ 
          transform: `translateZ(-50cqw) rotateY(${current * 90}deg)`,
          transition: `transform ${transitionTime}s cubic-bezier(0.23, 1, 0.32, 1)`
        }}
      >
        {promoProducts.map((product, idx) => {
          const imgUrl = product.image_url ? `http://localhost:5000${product.image_url.replace(/\\/g, '/')}` : 'https://via.placeholder.com/800x800?text=No+Image';
          return (
            <div
              key={`${product.id}-${idx}`}
              className="promo-cube-face"
              style={{
                transform: `rotateY(${idx * 90}deg) translateZ(50cqw)`,
                backgroundImage: `url("${encodeURI(imgUrl)}")`
              }}
              onClick={() => navigate(`/product/${product.id}`)}
            />
          );
        })}
      </div>
      
      <button className="promo-arrow promo-arrow-left" onClick={prevSlide}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6"></polyline>
        </svg>
      </button>
      <button className="promo-arrow promo-arrow-right" onClick={nextSlide}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 18 15 12 9 6"></polyline>
        </svg>
      </button>

      <div className="promo-slider-nav">
        {promoProducts.map((_, idx) => {
          return (
            <button 
              key={idx} 
              className={idx === activeIdx ? 'active' : ''} 
              onClick={() => {
                const steps = (activeIdx - idx + 4) % 4;
                if (steps === 0) return;
                setTransitionTime(0.5 + (steps * 0.3)); 
                setCurrent(c => c - steps);
              }}
            />
          );
        })}
      </div>
    </div>
  );
};

export default PromoSlider;
