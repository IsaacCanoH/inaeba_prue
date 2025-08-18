import { useEffect, useRef, useState } from "react"

export function useNetworkReachability({
  url = "/api/health",
  intervalMs = 5000,
  timeoutMs = 2500,
  failThreshold = 2,        
} = {}) {
  const [ok, setOk] = useState(typeof navigator !== "undefined" ? navigator.onLine : true)
  const timerRef = useRef(null)
  const failuresRef = useRef(0)     
  const abortRef = useRef(null)     

  const checkOnce = async () => {
    
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      failuresRef.current += 1
      if (failuresRef.current >= failThreshold) setOk(false)
      return
    }

    
    if (abortRef.current) {
      try { abortRef.current.abort() } catch {}
    }

    const ctrl = new AbortController()
    abortRef.current = ctrl
    const t = setTimeout(() => ctrl.abort(), timeoutMs)

    try {
      const res = await fetch(`${url}${url.includes("?") ? "&" : "?"}_=${Date.now()}`, {
        method: "GET",            
        cache: "no-store",
        signal: ctrl.signal,
        
        headers: {
          "cache-control": "no-cache, no-store, must-revalidate",
          "pragma": "no-cache",
          "expires": "0"
        },
        credentials: "same-origin",
        redirect: "manual",
        referrerPolicy: "no-referrer",
      })

      if (res.ok) {
        failuresRef.current = 0
        if (!ok) setOk(true) 
      } else {
        failuresRef.current += 1
        if (failuresRef.current >= failThreshold) setOk(false)
      }
    } catch (err) {
      
      const isAbort = err && (err.name === "AbortError")
      failuresRef.current += 1
      const threshold = isAbort ? Math.max(failThreshold, 2) : failThreshold
      if (failuresRef.current >= threshold) setOk(false)
    } finally {
      clearTimeout(t)
      if (abortRef.current === ctrl) abortRef.current = null
    }
  }

  useEffect(() => {
    const goOnline = () => {
      
      failuresRef.current = 0
      setOk(true)
      
      checkOnce()
    }
    const goOffline = () => {
      failuresRef.current = failThreshold 
      setOk(false)
    }

    window.addEventListener("online", goOnline)
    window.addEventListener("offline", goOffline)

    const start = () => {
      if (timerRef.current) return 
      checkOnce() 
      timerRef.current = setInterval(checkOnce, intervalMs)
    }
    const stop = () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
      if (abortRef.current) {
        try { abortRef.current.abort() } catch {}
        abortRef.current = null
      }
    }

    const onVisibility = () => {
      if (document.visibilityState === "visible") start()
      else stop()
    }

    onVisibility()
    document.addEventListener("visibilitychange", onVisibility)

    return () => {
      window.removeEventListener("online", goOnline)
      window.removeEventListener("offline", goOffline)
      document.removeEventListener("visibilitychange", onVisibility)
      stop()
    }
    
  }, [url, intervalMs, timeoutMs, failThreshold])

  return { ok }
}
