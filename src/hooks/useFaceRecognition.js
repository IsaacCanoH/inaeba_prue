import { useEffect, useRef, useState } from "react";
import * as faceapi from "face-api.js";
import { compareDescriptors } from "../services/faceApiService";
import {
  getFacePhoto,
  getLocalFace,
  saveFacePhoto,
} from "../services/dashboard/photoFaceService";
import { useToast } from "../context/ToastContext";
import { useLoader } from "../context/LoaderContext";

const tinyOptions = new faceapi.TinyFaceDetectorOptions({
  inputSize: 224,
  scoreThreshold: 0.4,
});

export const useFaceRecognition = ({ show, usuario, onSuccess, onFailure, isOffline }) => {
  const webcamRef = useRef(null);
  const rafRef = useRef(null);
  const processingRef = useRef(false);
  const alreadyFinishedRef = useRef(false);

  const { showError } = useToast();
  const { showLoader, hideLoader } = useLoader();

  const [feedback, setFeedback] = useState("Cargando modelos...");
  const [loadingFace, setLoadingFace] = useState(true);

  const waitForModels = async (timeoutMs = 10000) => {
    const start = Date.now();
    const loaded = () =>
      faceapi.nets?.tinyFaceDetector?.isLoaded &&
      faceapi.nets?.faceLandmark68Net?.isLoaded &&
      faceapi.nets?.faceRecognitionNet?.isLoaded;

    while (!loaded() && Date.now() - start < timeoutMs) {
      await new Promise((r) => setTimeout(r, 100));
    }
    return loaded();
  };

  const waitForVideoReady = async (video, timeoutMs = 8000) => {
    const start = Date.now();
    while (
      (!video ||
        video.readyState !== 4 ||
        video.videoWidth === 0 ||
        video.videoHeight === 0) &&
      Date.now() - start < timeoutMs
    ) {
      await new Promise((r) => setTimeout(r, 100));
    }
    return !!(video && video.readyState === 4 && video.videoWidth > 0 && video.videoHeight > 0);
  };

  useEffect(() => {
    if (show) handleStart();
    return cleanup;
  }, [show]);

  const cleanup = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    processingRef.current = false;
    alreadyFinishedRef.current = false;
    setFeedback("Cargando modelos...");
    setLoadingFace(true);
  };

  const handleStart = async () => {
    setFeedback("Preparando cámara y modelos...");
    setLoadingFace(false);

    const modelsOk = await waitForModels(12000);
    if (!modelsOk) {
      setFeedback("No se pudieron cargar los modelos");
      showError("Modelos no disponibles");
      return;
    }

    setFeedback("Prepara tu rostro, comenzaremos en 3 segundos...");
    await new Promise((r) => setTimeout(r, 3000));
    setFeedback("Buscando rostro...");

    const video = webcamRef.current?.video;
    const videoReady = await waitForVideoReady(video, 8000);
    if (!videoReady) {
      setFeedback("No se pudo iniciar la cámara");
      showError("Cámara no lista");
      return;
    }

    startDetectionLoop();
  };

  const startDetectionLoop = () => {
    const video = webcamRef.current.video;
    let attempts = 0;
    const maxAttempts = 60;
    const throttleMs = 200;

    const tick = async () => {
      if (!video || alreadyFinishedRef.current) return;
      await new Promise((r) => setTimeout(r, throttleMs));

      try {
        const detection = await faceapi.detectSingleFace(video, tinyOptions);
        attempts++;

        if (!detection) {
          if (attempts % 5 === 0) setFeedback("No se detecta tu rostro");
          if (attempts >= maxAttempts) return finishDetection(false);
        } else {
          const status = evaluateDetection(detection, video);
          if (status === "ok") return finishDetection(true);
          if (attempts % 5 === 0) setFeedback(status);
        }
      } catch (e) {
        console.warn("Error detectando rostro:", e);
        if (attempts >= maxAttempts) return finishDetection(false);
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
  };

  const evaluateDetection = (detection, video) => {
    const { box } = detection;
    const sizeRatio = box.width / video.videoWidth;
    const centerX = box.x + box.width / 2;
    const deviation = Math.abs(centerX - video.videoWidth / 2);

    if (sizeRatio < 0.2) return "Acércate un poco más";
    if (sizeRatio > 0.6) return "Aléjate un poco";
    if (deviation > 50) return "Centra tu rostro";
    return "ok";
  };

  const finishDetection = (success) => {
    if (alreadyFinishedRef.current) return;
    alreadyFinishedRef.current = true;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    if (success) {
      captureAndCompareFace();
    } else {
      hideLoader();
      showError("No se pudo capturar el rostro");
      onFailure?.();
    }
  };

  const detectFullFace = (video) => {
    return faceapi
      .detectSingleFace(video, tinyOptions)
      .withFaceLandmarks()
      .withFaceDescriptor();
  };

  const getFacePhotoConTimeout = (userId, ms) =>
    Promise.race([
      getFacePhoto(userId),
      new Promise((_, rej) => setTimeout(() => rej(new Error("timeout")), ms)),
    ]);

  const toFloat32 = (desc) => {
    if (desc instanceof Float32Array) return desc;
    if (Array.isArray(desc)) return new Float32Array(desc);
    if (desc && typeof desc === "object") return new Float32Array(Object.values(desc));
    if (typeof desc === "string") {
      try {
        return new Float32Array(JSON.parse(desc));
      } catch {}
    }
    throw new Error("Formato de descriptor desconocido");
  };

  const captureAndCompareFace = async () => {
    processingRef.current = true;
    let handedOff = false; 
    showLoader("Comparando rostros...");
    try {
      setFeedback("Procesando rostro, por favor espere...");

      const video = webcamRef.current.video;
      const detection = await detectFullFace(video);
      if (!detection) throw new Error("No se detectó el rostro.");

      const imageBase64 = getImageBase64(video);
      const descriptorArray = Array.from(detection.descriptor);

      let referenceData = null;
      try {
        referenceData = await getFacePhotoConTimeout(usuario.user.empleado_id, 8000);
      } catch (err) {
        console.warn("Fallo remoto (o timeout), usando local:", err?.message);
        referenceData = await getLocalFace(usuario.user.empleado_id);
      }

      if (referenceData?.descriptor) {
        const refDescriptor = toFloat32(referenceData.descriptor);
        const isMatch = compareDescriptors(detection.descriptor, refDescriptor);

        if (isMatch) {
          setFeedback("Rostro verificado correctamente");
          hideLoader();
          handedOff = true;
          onSuccess?.();
        } else {
          hideLoader();
          showError("Rostro no coincide");
          onFailure?.();
        }
        return;
      }

      if (!isOffline) {
        await saveFacePhoto({
          usuario_id: usuario.user.empleado_id,
          imagen_base64: imageBase64,
          descriptor: descriptorArray,
        });
        setFeedback("Rostro registrado correctamente");
        hideLoader();
        handedOff = true;
        onSuccess?.();
      } else {
        hideLoader();
        showError("No hay rostro de referencia (modo offline).");
        onFailure?.();
      }
    } catch (err) {
      console.error(err);
      hideLoader();
      showError("Error al procesar rostro");
      onFailure?.();
    } finally {
      if (!handedOff) {
        hideLoader();
      }
      processingRef.current = false;
    }
  };

  const getImageBase64 = (video) => {
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg");
  };

  return { webcamRef, feedback, loadingFace };
};
