import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

export const useScrollToSection = () => {
  const location = useLocation()

  useEffect(() => {
    // Check if the URL has a hash (like #about or #faq)
    if (location.hash) {
      // Small delay to ensure the page has rendered
      setTimeout(() => {
        const element = document.querySelector(location.hash)
        if (element) {
          element.scrollIntoView({ 
            behavior: 'smooth',
            block: 'start'
          })
        }
      }, 100)
    }
  }, [location.hash])
}
