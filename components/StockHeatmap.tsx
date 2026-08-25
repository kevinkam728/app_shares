'use client'

import { useEffect, useRef } from 'react'

export default function StockHeatmap() {
  const container = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Evitar inyecciones duplicadas en Strict Mode
    if (!container.current || container.current.querySelector('script')) return

    const script = document.createElement("script")
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-stock-heatmap.js"
    script.type = "text/javascript"
    script.async = true
    script.innerHTML = JSON.stringify({
      "exchanges": [],
      "dataSource": "SPX500",
      "grouping": "sector",
      "blockSize": "market_cap_basic",
      "blockColor": "change",
      "locale": "es",
      "symbolUrl": "",
      "colorTheme": "dark",
      "hasTopBar": false,
      "isDataSetEnabled": false,
      "isZoomEnabled": true,
      "hasSymbolTooltip": true,
      "width": "100%",
      "height": "100%"
    })
    container.current.appendChild(script)
  }, [])

  return (
    <div className="w-full mt-6" style={{ height: "600px", minHeight: "600px" }}>
      <div className="tradingview-widget-container" ref={container} style={{ height: "100%", width: "100%" }}>
        <div className="tradingview-widget-container__widget" style={{ height: "100%", width: "100%" }}></div>
      </div>
    </div>
  )
}
