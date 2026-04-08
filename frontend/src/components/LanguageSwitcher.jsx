// code in this file is written by worapol สุดหล่อ
import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import './LanguageSwitcher.css';

const LanguageSwitcher = () => {
  const { language, toggleLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close on click outside - by worapol สุดหล่อ
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (lang) => {
    toggleLanguage(lang);
    setIsOpen(false);
  };

  return (
    <div className="lang-dropdown-container" ref={dropdownRef}>
      <button 
        className={`lang-current-btn ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Change Language"
      >
        <span>{language.toUpperCase()}</span>
        <svg 
          className={`lang-arrow ${isOpen ? 'rotate' : ''}`}
          width="10" height="10" viewBox="0 0 24 24" fill="none" 
          stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
        >
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </button>

      {isOpen && (
        <div className="lang-menu">
          <div 
            className={`lang-menu-item ${language === 'en' ? 'selected' : ''}`}
            onClick={() => handleSelect('en')}
          >
            English
          </div>
          <div 
            className={`lang-menu-item ${language === 'th' ? 'selected' : ''}`}
            onClick={() => handleSelect('th')}
          >
            ภาษาไทย
          </div>
        </div>
      )}
    </div>
  );
};

export default LanguageSwitcher;
