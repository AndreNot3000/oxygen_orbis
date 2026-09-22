import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import RoomsSection from './components/RoomsSection';
import AmenitiesSection from './components/AmenitiesSection';
import LagosEscapeSection from './components/LagosEscapeSection';
import TestimonialsSection from './components/TestimonialsSection';
import LocationSection from './components/LocationSection';
import FaqSection from './components/FaqSection';
import Footer from './components/Footer';
import BookingModal from './components/BookingModal';
import ManagementPitchModal from './components/ManagementPitchModal';
import AvailabilityCalendarModal from './components/AvailabilityCalendarModal';
import StaffPortalModal from './components/StaffPortalModal';
import AddonsSection from './components/AddonsSection';
import WhatsAppButton from './components/WhatsAppButton';
import { ROOMS_DATA } from './data/resortData';

export default function App() {
  // Persistent currency state
  const [currency, setCurrency] = useState(() => {
    return localStorage.getItem('oxygen_currency') || 'NGN';
  });

  useEffect(() => {
    localStorage.setItem('oxygen_currency', currency);
  }, [currency]);

  // Modal states
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [bookingInitialData, setBookingInitialData] = useState(null);
  const [isPitchOpen, setIsPitchOpen] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isPmsOpen, setIsPmsOpen] = useState(false);

  // URL Hash (#staff, #pms) and global keyboard shortcut (Ctrl+Shift+P) for staff terminal
  useEffect(() => {
    const checkHash = () => {
      if (window.location.hash === '#staff' || window.location.hash === '#pms') {
        setIsPmsOpen(true);
      }
    };
    checkHash();
    window.addEventListener('hashchange', checkHash);

    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'P' || e.key === 'p')) {
        e.preventDefault();
        setIsPmsOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('hashchange', checkHash);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Hero progress & navbar visibility
  const [heroProgress, setHeroProgress] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isHeaderHovered, setIsHeaderHovered] = useState(false);
  const [isFooterVisible, setIsFooterVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      setIsScrolled(scrollY > 80);

      // On desktop (> 700px), let the full-screen footer take the entire screen cleanly
      if (window.innerWidth > 700) {
        const footerEl = document.querySelector('.kex-footer');
        if (footerEl) {
          const rect = footerEl.getBoundingClientRect();
          // Footer is scrolled into view when its top edge enters the upper viewport
          setIsFooterVisible(rect.top <= 120);
        }
      } else {
        setIsFooterVisible(false);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll);
    handleScroll();
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, []);

  const showNavbar = ((heroProgress >= 0.85 || isScrolled) && !isFooterVisible) || isHeaderHovered;

  const handleOpenBooking = (data = null) => {
    setBookingInitialData(data);
    setIsBookingOpen(true);
  };

  const handleBookSpecificRoom = (roomId) => {
    setBookingInitialData({
      roomType: roomId,
    });
    setIsBookingOpen(true);
  };

  const handleSelectDatesAndBook = ({ checkIn, checkOut, roomType }) => {
    setIsCalendarOpen(false);
    setBookingInitialData({
      checkIn,
      checkOut,
      roomType,
      guests: 2,
    });
    setIsBookingOpen(true);
  };

  const handleBookWithAddon = (addonId) => {
    setBookingInitialData({
      addonId,
      roomType: ROOMS_DATA[0].id,
      guests: 2,
    });
    setIsBookingOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#1A0C06] text-slate-100 flex flex-col selection:bg-[#C9854A] selection:text-black">
      {/* Invisible top hover zone to peek navbar if user hovers top edge */}
      <div 
        className="fixed top-0 left-0 w-full h-3 z-50 pointer-events-auto"
        onMouseEnter={() => setIsHeaderHovered(true)}
      />

      {/* Navigation */}
      <Navbar
        currency={currency}
        setCurrency={setCurrency}
        visible={showNavbar}
        onMouseEnter={() => setIsHeaderHovered(true)}
        onMouseLeave={() => setIsHeaderHovered(false)}
        onOpenBooking={() => handleOpenBooking()}
        onOpenPitch={() => setIsPitchOpen(true)}
        onOpenCalendar={() => setIsCalendarOpen(true)}
        onOpenPms={() => setIsPmsOpen(true)}
      />

      {/* Main Content Sections */}
      <main className="flex-1">
        {/* Cinematic Scroll-Expanding Hero */}
        <Hero
          currency={currency}
          onOpenBooking={handleOpenBooking}
          onOpenCalendar={() => setIsCalendarOpen(true)}
          onProgressChange={setHeroProgress}
        />

        {/* Rooms & Suites Showcase with Filter & Detail Modal */}
        <RoomsSection
          currency={currency}
          onBookRoom={handleBookSpecificRoom}
        />

        {/* Stay Enhancements & Add-ons Section */}
        <AddonsSection
          currency={currency}
          onBookWithAddon={handleBookWithAddon}
        />

        {/* Resort Experiences & Mac Foster Nightlife */}
        <AmenitiesSection />

        {/* The Lagos-to-Ibadan 2-Hour Train Staycation Advantage */}
        <LagosEscapeSection
          onOpenBooking={() => handleOpenBooking()}
        />

        {/* Real Guest Testimonials & Reviews */}
        <TestimonialsSection />

        {/* Location & Moniya Train Station Proximity */}
        <LocationSection />

        {/* FAQs */}
        <FaqSection />
      </main>

      {/* Footer */}
      <Footer
        onOpenPitch={() => setIsPitchOpen(true)}
        onOpenBooking={() => handleOpenBooking()}
        onOpenPms={() => setIsPmsOpen(true)}
      />

      {/* Interactive 4-Step Booking Checkout Modal */}
      <BookingModal
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
        initialData={bookingInitialData}
        currency={currency}
      />

      {/* Real-time Rate Matrix & Availability Calendar Modal */}
      <AvailabilityCalendarModal
        isOpen={isCalendarOpen}
        onClose={() => setIsCalendarOpen(false)}
        currency={currency}
        onSelectDatesAndBook={handleSelectDatesAndBook}
      />

      {/* Management Pitch Deck & OTA Commission ROI Calculator Modal */}
      <ManagementPitchModal
        isOpen={isPitchOpen}
        onClose={() => setIsPitchOpen(false)}
      />

      {/* Staff PMS & Front Desk Reception Portal Modal */}
      <StaffPortalModal
        isOpen={isPmsOpen}
        onClose={() => setIsPmsOpen(false)}
      />

      {/* Floating WhatsApp Reservations Button */}
      <WhatsAppButton />
    </div>
  );
}
