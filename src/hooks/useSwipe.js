import { useState } from 'react';

export const useSwipe = ({ onSwipeLeft, onSwipeRight, range = 75 }) => {
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);

  // Jarak minimum swipe (px) agar dianggap valid
  const minSwipeDistance = range;

  const onTouchStart = (e) => {
    setTouchEnd(null); // Reset
    setTouchStart({
        x: e.targetTouches[0].clientX,
        y: e.targetTouches[0].clientY
    });
  };

  const onTouchMove = (e) => {
      setTouchEnd({
          x: e.targetTouches[0].clientX,
          y: e.targetTouches[0].clientY
      });
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distanceX = touchStart.x - touchEnd.x;
    const distanceY = touchStart.y - touchEnd.y;
    const isLeftSwipe = distanceX > minSwipeDistance;
    const isRightSwipe = distanceX < -minSwipeDistance;

    // Pastikan gerakan lebih dominan horizontal daripada vertikal (supaya tidak ganggu scroll ke bawah)
    if (Math.abs(distanceX) > Math.abs(distanceY)) {
        if (isLeftSwipe && onSwipeLeft) {
            onSwipeLeft();
        }
        if (isRightSwipe && onSwipeRight) {
            onSwipeRight();
        }
    }
  };

  return { onTouchStart, onTouchMove, onTouchEnd };
};
