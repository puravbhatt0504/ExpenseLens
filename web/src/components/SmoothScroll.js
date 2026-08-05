'use client';

import { ReactLenis } from 'lenis/react';
import { useRef, useState, useEffect } from 'react';

export default function SmoothScroll({ children, className = "flex-1 overflow-y-auto h-full bg-surface relative" }) {
  const wrapperRef = useRef(null);
  const contentRef = useRef(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
  }, []);

  return (
    <div ref={wrapperRef} className={className}>
      <div ref={contentRef} className="min-h-full flex flex-col">
        {ready ? (
          <ReactLenis 
            root={false} 
            options={{ 
              wrapper: wrapperRef.current, 
              content: contentRef.current, 
              lerp: 0.1, 
              duration: 1.5,
              smoothTouch: true 
            }}
          >
            {children}
          </ReactLenis>
        ) : (
          children
        )}
      </div>
    </div>
  );
}
