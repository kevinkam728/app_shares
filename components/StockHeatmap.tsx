'use client'

import { useEffect, useRef } from 'react'

export default function StockHeatmap() {
  const container = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const script = document.createElement('script')
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-stock-heatmap.js'
    script.async = true
    script.innerHTML = JSON.stringify({
      dataSource: 'SPX500',
      colorTheme: 'dark',
      locale: 'es',
      width: '100%',
      height: '500',
      isTransparent: true,
      hasTopBanner: false,
      isEmbedded: true
    })
    
    if (container.current) {
      container.current.appendChild(script)
    }

    return () => {
      if (container.current) {
        container.current.innerHTML = ''
      }
    }
  }, [])

  return (
    <div className="stock-heatmap-container w-full rounded-xl overflow-hidden mb-8" ref={container}>
      <div className="tradingview-widget-container__widget"></div>
    </div>
  )
}
