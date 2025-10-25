'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function Home() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMenuOpen]);

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 bg-white border-b-2 border-red-600 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex-shrink-0">
              <Link href="/" className="text-xl font-black text-red-600 uppercase tracking-tight">
                Bremer Locksmith
              </Link>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex space-x-6">
              <Link href="/" className="text-gray-800 font-semibold uppercase text-sm tracking-wide hover:text-red-600 transition-colors">
                Home
              </Link>
              <Link href="/about" className="text-gray-800 font-semibold uppercase text-sm tracking-wide hover:text-red-600 transition-colors">
                About
              </Link>
              <Link href="/contact" className="text-gray-800 font-semibold uppercase text-sm tracking-wide hover:text-red-600 transition-colors">
                Contact
              </Link>
              <a 
                href="tel:+1-XXX-XXX-XXXX" 
                className="bg-red-600 text-white px-4 py-2 rounded font-bold uppercase text-sm tracking-wide hover:bg-red-700 transition-colors"
              >
                Emergency: (XXX) XXX-XXXX
              </a>
            </nav>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={toggleMenu}
                className="text-gray-800 hover:text-red-600 focus:outline-none"
                aria-label="Toggle menu"
              >
                <div className="w-6 h-6 flex flex-col justify-center space-y-1">
                  <span className={`block h-0.5 w-6 bg-current transition-transform duration-300 ${isMenuOpen ? 'rotate-45 translate-y-1.5' : ''}`}></span>
                  <span className={`block h-0.5 w-6 bg-current transition-opacity duration-300 ${isMenuOpen ? 'opacity-0' : ''}`}></span>
                  <span className={`block h-0.5 w-6 bg-current transition-transform duration-300 ${isMenuOpen ? '-rotate-45 -translate-y-1.5' : ''}`}></span>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden bg-white border-t-2 border-red-600">
            <div className="px-2 pt-2 pb-3 space-y-1">
              <Link href="/" className="block px-3 py-2 text-gray-800 font-semibold uppercase text-sm tracking-wide hover:text-red-600">
                Home
              </Link>
              <Link href="/about" className="block px-3 py-2 text-gray-800 font-semibold uppercase text-sm tracking-wide hover:text-red-600">
                About
              </Link>
              <Link href="/contact" className="block px-3 py-2 text-gray-800 font-semibold uppercase text-sm tracking-wide hover:text-red-600">
                Contact
              </Link>
              <a 
                href="tel:+1-XXX-XXX-XXXX" 
                className="block mx-3 my-2 bg-red-600 text-white px-4 py-3 rounded font-bold uppercase text-sm tracking-wide text-center hover:bg-red-700 transition-colors"
              >
                Emergency: (XXX) XXX-XXXX
              </a>
            </div>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="pt-16 bg-black text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
          <div className="text-center">
            {/* Emergency Badge */}
            <div className="mb-6">
              <span className="inline-block bg-red-600 text-white px-4 py-2 rounded-full font-bold text-sm uppercase tracking-wider animate-pulse">
                🚨 24/7 Emergency Service
              </span>
            </div>

            {/* Main Headline */}
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-black uppercase tracking-tight mb-4 leading-tight">
              Minnesota's Most
              <span className="block text-red-600">Trusted Locksmith</span>
            </h1>

            {/* Subtitle */}
            <p className="text-lg md:text-xl text-gray-300 mb-8 max-w-2xl mx-auto font-medium">
              Licensed • Insured • Fast Response • Professional Service
            </p>

            {/* CTA Button */}
            <div className="mb-8">
              <a 
                href="tel:+1-XXX-XXX-XXXX"
                className="inline-flex items-center gap-3 bg-red-600 text-white px-8 py-4 rounded-lg font-black text-lg uppercase tracking-wide hover:bg-red-700 transition-colors"
              >
                <span className="text-xl">📞</span>
                <span>Call Now: (XXX) XXX-XXXX</span>
              </a>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap justify-center gap-6 max-w-3xl mx-auto">
              <div className="flex items-center gap-2 text-white">
                <div className="w-5 h-5 bg-red-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-xs">✓</span>
                </div>
                <span className="font-semibold">Licensed & Insured</span>
              </div>
              <div className="flex items-center gap-2 text-white">
                <div className="w-5 h-5 bg-red-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-xs">✓</span>
                </div>
                <span className="font-semibold">15-30 Min Response</span>
              </div>
              <div className="flex items-center gap-2 text-white">
                <div className="w-5 h-5 bg-red-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-xs">✓</span>
                </div>
                <span className="font-semibold">No Damage Guarantee</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-4xl font-black text-black uppercase tracking-tight mb-3">
              Professional Locksmith Services
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Fast, reliable, and professional security solutions
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Emergency Service Card */}
            <div className="bg-white p-6 rounded-lg shadow-lg border-2 border-red-600 hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🚨</span>
                  <h3 className="text-xl font-bold text-black uppercase tracking-tight">Emergency Lockout</h3>
                </div>
                <span className="bg-red-600 text-white px-2 py-1 rounded text-xs font-bold uppercase">24/7</span>
              </div>
              <p className="text-gray-600 mb-4">
                Fast response lockout assistance for homes, cars, and businesses.
              </p>
              <ul className="space-y-2 mb-6">
                <li className="flex items-center gap-2 text-gray-700">
                  <span className="text-red-600 font-bold">✓</span>
                  <span>Residential lockouts</span>
                </li>
                <li className="flex items-center gap-2 text-gray-700">
                  <span className="text-red-600 font-bold">✓</span>
                  <span>Automotive lockouts</span>
                </li>
                <li className="flex items-center gap-2 text-gray-700">
                  <span className="text-red-600 font-bold">✓</span>
                  <span>Commercial lockouts</span>
                </li>
                <li className="flex items-center gap-2 text-gray-700">
                  <span className="text-red-600 font-bold">✓</span>
                  <span>15-30 min response</span>
                </li>
              </ul>
              <a 
                href="tel:+1-XXX-XXX-XXXX"
                className="block w-full bg-red-600 text-white py-3 rounded font-bold uppercase text-center hover:bg-red-700 transition-colors"
              >
                Call Now
              </a>
            </div>

            {/* Key Services Card */}
            <div className="bg-white p-6 rounded-lg shadow-lg border-2 border-gray-200 hover:border-red-600 hover:shadow-xl transition-all">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">🔑</span>
                <h3 className="text-xl font-bold text-black uppercase tracking-tight">Key Services</h3>
              </div>
              <p className="text-gray-600 mb-4">
                Professional key duplication, programming, and rekeying services.
              </p>
              <ul className="space-y-2 mb-6">
                <li className="flex items-center gap-2 text-gray-700">
                  <span className="text-red-600 font-bold">✓</span>
                  <span>Key duplication</span>
                </li>
                <li className="flex items-center gap-2 text-gray-700">
                  <span className="text-red-600 font-bold">✓</span>
                  <span>Key programming</span>
                </li>
                <li className="flex items-center gap-2 text-gray-700">
                  <span className="text-red-600 font-bold">✓</span>
                  <span>Lock rekeying</span>
                </li>
                <li className="flex items-center gap-2 text-gray-700">
                  <span className="text-red-600 font-bold">✓</span>
                  <span>Master key systems</span>
                </li>
              </ul>
              <Link 
                href="/contact"
                className="block w-full bg-red-600 text-white py-3 rounded font-bold uppercase text-center hover:bg-red-700 transition-colors"
              >
                Learn More
              </Link>
            </div>

            {/* Lock Services Card */}
            <div className="bg-white p-6 rounded-lg shadow-lg border-2 border-gray-200 hover:border-red-600 hover:shadow-xl transition-all">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">🛠️</span>
                <h3 className="text-xl font-bold text-black uppercase tracking-tight">Lock Services</h3>
              </div>
              <p className="text-gray-600 mb-4">
                Complete lock repair, installation, and security upgrades.
              </p>
              <ul className="space-y-2 mb-6">
                <li className="flex items-center gap-2 text-gray-700">
                  <span className="text-red-600 font-bold">✓</span>
                  <span>Lock installation</span>
                </li>
                <li className="flex items-center gap-2 text-gray-700">
                  <span className="text-red-600 font-bold">✓</span>
                  <span>Lock repair</span>
                </li>
                <li className="flex items-center gap-2 text-gray-700">
                  <span className="text-red-600 font-bold">✓</span>
                  <span>Deadbolt installation</span>
                </li>
                <li className="flex items-center gap-2 text-gray-700">
                  <span className="text-red-600 font-bold">✓</span>
                  <span>Security upgrades</span>
                </li>
              </ul>
              <Link 
                href="/contact"
                className="block w-full bg-red-600 text-white py-3 rounded font-bold uppercase text-center hover:bg-red-700 transition-colors"
              >
                Get Quote
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-4xl font-black text-black uppercase tracking-tight mb-3">
              Why Choose Bremer Locksmith?
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Minnesota's most trusted locksmith service with a proven track record of reliability, 
              professionalism, and customer satisfaction.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-lg text-center hover:shadow-xl transition-shadow">
              <div className="text-4xl font-black text-red-600 mb-3">15+</div>
              <h3 className="text-xl font-bold text-black uppercase tracking-tight mb-3">Years Experience</h3>
              <p className="text-gray-600">Serving Minnesota communities with expertise</p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-lg text-center hover:shadow-xl transition-shadow">
              <div className="text-4xl font-black text-red-600 mb-3">24/7</div>
              <h3 className="text-xl font-bold text-black uppercase tracking-tight mb-3">Emergency Service</h3>
              <p className="text-gray-600">Always available when you need us most</p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-lg text-center hover:shadow-xl transition-shadow">
              <div className="text-4xl font-black text-red-600 mb-3">100%</div>
              <h3 className="text-xl font-bold text-black uppercase tracking-tight mb-3">Licensed & Insured</h3>
              <p className="text-gray-600">Fully certified for your complete protection</p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-16 bg-black text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-4xl font-black text-white uppercase tracking-tight mb-3">
              Get Help Now
            </h2>
            <p className="text-lg text-gray-300 max-w-2xl mx-auto">
              Professional locksmith service when you need it most
            </p>
          </div>

          {/* Emergency Contact Card */}
          <div className="max-w-3xl mx-auto mb-12">
            <div className="bg-red-600 p-8 rounded-lg text-center shadow-xl">
              <h3 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tight mb-3">
                🚨 Emergency Lockout?
              </h3>
              <p className="text-lg text-white mb-6 opacity-90">
                Call now for immediate assistance
              </p>
              <a 
                href="tel:+1-XXX-XXX-XXXX"
                className="inline-flex items-center gap-3 bg-white text-red-600 px-8 py-4 rounded-lg font-black text-xl uppercase tracking-wide hover:bg-gray-100 transition-colors"
              >
                <span className="text-2xl">📞</span>
                <span>(XXX) XXX-XXXX</span>
              </a>
              <div className="mt-4 text-white text-lg font-semibold opacity-90">
                Average Response: 15-30 minutes
              </div>
            </div>
          </div>

          {/* Contact Info */}
          <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            <div className="bg-gray-900 p-6 rounded-lg border-2 border-gray-800 text-center">
              <h3 className="text-xl font-bold text-white uppercase tracking-tight mb-3">Service Area</h3>
              <p className="text-gray-300">
                Minneapolis • St. Paul • Bloomington • Plymouth • Eden Prairie • Minnetonka
              </p>
            </div>

            <div className="bg-gray-900 p-6 rounded-lg border-2 border-gray-800 text-center">
              <h3 className="text-xl font-bold text-white uppercase tracking-tight mb-3">Business Hours</h3>
              <p className="text-gray-300 mb-2">
                <strong>Emergency:</strong> 24/7/365
              </p>
              <p className="text-gray-300">
                <strong>Regular:</strong> Mon-Fri 8AM-6PM, Sat 9AM-4PM
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black text-white py-12 border-t-4 border-red-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-6 mb-6">
            <div>
              <h3 className="text-xl font-black text-red-600 uppercase tracking-tight mb-3">
                Bremer Locksmith
              </h3>
              <p className="text-gray-300">
                Professional locksmith services in Minnesota. Licensed, insured, and available 24/7 for your security needs.
              </p>
            </div>

            <div>
              <h4 className="text-lg font-bold text-white uppercase tracking-tight mb-3">Services</h4>
              <ul className="space-y-1">
                <li><a href="#services" className="text-gray-300 hover:text-red-600 transition-colors">Emergency Lockout</a></li>
                <li><a href="#services" className="text-gray-300 hover:text-red-600 transition-colors">Key Duplication</a></li>
                <li><a href="#services" className="text-gray-300 hover:text-red-600 transition-colors">Lock Rekeying</a></li>
                <li><a href="#services" className="text-gray-300 hover:text-red-600 transition-colors">Lock Repair</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-lg font-bold text-white uppercase tracking-tight mb-3">Contact</h4>
              <p className="text-gray-300 mb-2">
                Emergency: <a href="tel:+1-XXX-XXX-XXXX" className="text-red-600 hover:text-white transition-colors font-bold">(XXX) XXX-XXXX</a>
              </p>
              <p className="text-gray-300">Serving Minnesota</p>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-6 text-center">
            <p className="text-gray-400">
              &copy; 2024 Bremer Locksmith. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}