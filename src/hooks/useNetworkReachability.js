import { useEffect, useRef, useState } from "react"

export function useNetworkReachability({
  url = "/api/health",         
  intervalMs = 5000,           
  timeoutMs = 2500,            
} = {}) {
  const [ok, setOk] = useState(typeof navigator !== "undefined" ? navigator.onLine : true)
  const timerRef = useRef(null)

  const checkOnce = async () => {
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setOk(false)
      return
    }

    const ctrl = new AbortController()
    const t = setTimeout(() => ctrl.abort(), timeoutMs)

    try {
      const res = await fetch(`${url}${url.includes("?") ? "&" : "?"}_=${Date.now()}`, {
        method: "HEAD",
        cache: "no-store",
        signal: ctrl.signal,
      })
      setOk(res.ok) // 2xx == OK
    } catch {
      setOk(false)
    } finally {
      clearTimeout(t)
    }
  }

  useEffect(() => {
    const goOnline = () => setOk(true)
    const goOffline = () => setOk(false)

    window.addEventListener("online", goOnline)
    window.addEventListener("offline", goOffline)

    const start = () => {
      // chequeo inmediato para no esperar al primer intervalo
      checkOnce()
      timerRef.current = setInterval(checkOnce, intervalMs)
    }
    const stop = () => {
      if (timerRef.current) clearInterval(timerRef.current)
      timerRef.current = null
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
  }, [url, intervalMs, timeoutMs])

  return { ok }
}