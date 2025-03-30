'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Sparkles, Loader } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AnimatedGenerateButtonProps {
  onClick: () => void
  disabled: boolean
  isGenerating: boolean
}

export default function AnimatedGenerateButton({
  onClick,
  disabled,
  isGenerating
}: AnimatedGenerateButtonProps) {
  const [bgPosition, setBgPosition] = useState(0)
  const buttonRef = useRef<HTMLButtonElement>(null)
  
  // Animate background
  useEffect(() => {
    const interval = setInterval(() => {
      setBgPosition(prev => (prev + 1) % 100)
    }, 50)
    
    return () => clearInterval(interval)
  }, [])
  
  // Handle click with ripple effect
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled) return
    
    // Add ripple effect
    const button = buttonRef.current
    if (button) {
      const rect = button.getBoundingClientRect()
      const size = Math.max(rect.width, rect.height)
      const x = e.clientX - rect.left - size / 2
      const y = e.clientY - rect.top - size / 2
      
      const ripple = document.createElement('span')
      ripple.style.width = ripple.style.height = `${size}px`
      ripple.style.left = `${x}px`
      ripple.style.top = `${y}px`
      ripple.classList.add('absolute', 'rounded-full', 'bg-white/30', 'pointer-events-none')
      ripple.style.transform = 'scale(0)'
      ripple.style.animation = 'ripple 600ms linear'
      
      button.appendChild(ripple)
      
      setTimeout(() => {
        ripple.remove()
      }, 700)
    }
    
    // Call the provided onClick handler
    onClick()
  }
  
  return (
    <div className="relative inline-block animate-float">
      {/* Sparkle particles */}
      <div className="absolute -inset-4 z-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 h-2 w-2 rounded-full bg-yellow-300 animate-[ping_2s_ease-in-out_infinite]" style={{ animationDelay: '0.1s' }}></div>
        <div className="absolute top-1/3 left-0 h-1.5 w-1.5 rounded-full bg-blue-400 animate-[ping_2.2s_ease-in-out_infinite]" style={{ animationDelay: '0.5s' }}></div>
        <div className="absolute bottom-1/4 left-1/5 h-1 w-1 rounded-full bg-pink-400 animate-[ping_1.8s_ease-in-out_infinite]" style={{ animationDelay: '0.2s' }}></div>
        <div className="absolute bottom-0 right-1/3 h-2 w-2 rounded-full bg-purple-300 animate-[ping_1.5s_ease-in-out_infinite]" style={{ animationDelay: '0.7s' }}></div>
        <div className="absolute top-1/4 right-0 h-1.5 w-1.5 rounded-full bg-indigo-300 animate-[ping_2.5s_ease-in-out_infinite]" style={{ animationDelay: '0.3s' }}></div>
      </div>
      
      {/* Outer glow */}
      <div className="absolute -inset-2 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 opacity-75 blur-md animate-pulse"></div>
      
      <Button
        ref={buttonRef}
        onClick={handleClick}
        disabled={disabled}
        type="button"
        className={cn(
          "relative overflow-hidden text-white font-semibold transition-all duration-300",
          "bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600",
          "hover:from-amber-500 hover:via-amber-600 hover:to-amber-700",
          "shadow-[0_4px_14px_rgba(251,191,36,0.4)]",
          "hover:shadow-[0_8px_25px_rgba(251,191,36,0.8)]",
          "flex items-center gap-3 py-6 px-8 rounded-xl",
          "active:scale-95 active:shadow-inner disabled:opacity-70 disabled:pointer-events-none"
        )}
        style={{
          backgroundSize: '200% 200%',
          animation: 'bg-shift 3s ease infinite'
        }}
      >
        {/* Inner animated background */}
        <span className="absolute inset-0 flex items-center justify-center overflow-hidden rounded-xl">
          <span className="h-full w-full animate-pulse bg-gradient-to-r from-amber-400/20 via-amber-500/20 to-amber-600/20 blur-md"></span>
        </span>
        
        {isGenerating ? (
          <>
            <div className="relative flex items-center justify-center rounded-full bg-white/20 p-1.5 animate-spin">
              <Loader className="h-4 w-4 text-white" />
            </div>
            <span className="relative z-10 font-bold tracking-wide">Generating...</span>
          </>
        ) : (
          <>
            <div className="relative flex items-center justify-center">
              <div className="absolute -inset-1 opacity-50 animate-ping rounded-full bg-white/40"></div>
              <Sparkles className="h-5 w-5 text-white relative z-10" />
            </div>
            <span className="relative z-10 font-bold tracking-wide">
              Generate Notes
            </span>
          </>
        )}
      </Button>
    </div>
  )
} 