// code in this file is written by worapol สุดหล่อ
import React, { useState, useEffect } from 'react';

import { useLanguage } from '../context/LanguageContext';

const CategoryHero = ({ products, title }) => {
  const { t } = useLanguage();
  const [current, setCurrent] = useState(0);
  const heroProducts = products.length > 0 ? products.slice(0, 5) : [];

  useEffect(() => {
    if (heroProducts.length <= 1) return;
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % heroProducts.length);
    }, 6000); // 6 seconds for each slide - by worapol สุดหล่อ
    return () => clearInterval(timer);
  }, [heroProducts.length]);

  if (!heroProducts || heroProducts.length === 0) return null;

  return (
    <div className="category-hero-wrapper">
      <div className="category-hero-slides">
        {heroProducts.map((product, idx) => (
          <div
            key={product.id}
            className={`category-hero-slide ${idx === current ? 'active' : ''}`}
            style={{ backgroundImage: `url("http://localhost:5000${product.image_url}")` }}
          >
            <div className="category-hero-overlay">
              <div className="hero-floating-badge">{t('ps_featured')}</div>
              <div className="category-hero-text">
                <h1 className="hero-brand-title">{title}</h1>
                <h2 className="hero-product-teaser">{product.name}</h2>
                <div className="hero-divider"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="category-hero-nav">
        {heroProducts.map((_, idx) => (
          <button 
            key={idx} 
            className={`hero-nav-dot ${idx === current ? 'active' : ''}`}
            onClick={() => setCurrent(idx)}
          />
        ))}
      </div>
    </div>
  );
};

export default CategoryHero;
