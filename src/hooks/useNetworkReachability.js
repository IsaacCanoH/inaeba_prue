import { useEffect, useRef, useState } from "react"

export function useNetworkReachability({
  url = "/api/health",
  intervalMs = 5000,
  timeoutMs = 2500,
  failThreshold = 2,        // nuevo: cuántos fallos seguidos antes de decir "offline"
} = {}) {
  const [ok, setOk] = useState(typeof navigator !== "undefined" ? navigator.onLine : true)
  const timerRef = useRef(null)
  const failuresRef = useRef(0)     // cuenta de fallos consecutivos
  const abortRef = useRef(null)     // para abortar entre visibilidad/cambios

  const checkOnce = async () => {
    // Si el navegador reporta offline, es casi seguro offline: sal rápido
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      failuresRef.current += 1
      if (failuresRef.current >= failThreshold) setOk(false)
      return
    }

    // Cancela cualquier request previo colgando
    if (abortRef.current) {
      try { abortRef.current.abort() } catch {}
    }

    const ctrl = new AbortController()
    abortRef.current = ctrl
    const t = setTimeout(() => ctrl.abort(), timeoutMs)

    try {
      const res = await fetch(`${url}${url.includes("?") ? "&" : "?"}_=${Date.now()}`, {
        method: "GET",            // <-- más compatible que HEAD
        cache: "no-store",
        signal: ctrl.signal,
        // endurece el no-cache y evita respuestas servidas por caché intermedia
        headers: {
          "cache-control": "no-cache, no-store, must-revalidate",
          "pragma": "no-cache",
          "expires": "0"
        },
        credentials: "same-origin",
        redirect: "manual",
        referrerPolicy: "no-referrer",
      })

      // Solo consideramos éxito si 2xx
      if (res.ok) {
        failuresRef.current = 0
        if (!ok) setOk(true) // evita renders extra cuando ya está true
      } else {
        failuresRef.current += 1
        if (failuresRef.current >= failThreshold) setOk(false)
      }
    } catch (err) {
      // Si fue un abort por timeout, no tumbar al primer intento
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
      // al volver "online" del navegador, resetea contadores y revalida
      failuresRef.current = 0
      setOk(true)
      // dispara un chequeo para confirmar reachability real
      checkOnce()
    }
    const goOffline = () => {
      failuresRef.current = failThreshold // fuerza transición rápida si el navegador lo dice
      setOk(false)
    }

    window.addEventListener("online", goOnline)
    window.addEventListener("offline", goOffline)

    const start = () => {
      if (timerRef.current) return // ya corriendo
      checkOnce() // chequeo inmediato
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, intervalMs, timeoutMs, failThreshold])

  return { ok }
}
