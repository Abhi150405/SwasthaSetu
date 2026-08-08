import React, { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { endpoints } from "@/lib/api-config";
import { 
  ScanLine, 
  UploadCloud, 
  Camera, 
  CameraOff, 
  FileCheck, 
  X, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle,
  QrCode,
  Zap,
  RotateCcw
} from "lucide-react";

export default function Scan() {
  const [code, setCode] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [cameraOn, setCameraOn] = useState(false);
  const [qrDetected, setQrDetected] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"upload" | "camera" | "manual">("upload");

  const [result, setResult] = useState<{
    name: string;
    qty: string;
    kcal: number;
    tags: string[];
    ingredients?: string;
    protein?: number;
    carbs?: number;
    fat?: number;
  } | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // --- Camera Operations ---
  const startCamera = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraOn(true);
      setActiveTab("camera");
    } catch (e) {
      setError(
        "Camera access denied or unavailable. You can still drag & drop an image or enter a code.",
      );
      setCameraOn(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setCameraOn(false);
  };

  useEffect(() => () => stopCamera(), []);

  // --- Automatic Live Camera QR & Barcode Detection ---
  useEffect(() => {
    let scanInterval: NodeJS.Timeout | null = null;

    if (cameraOn && videoRef.current) {
      scanInterval = setInterval(async () => {
        if (!videoRef.current || isScanning) return;

        // Use native browser BarcodeDetector API if supported
        if ("BarcodeDetector" in window) {
          try {
            const detector = new (window as any).BarcodeDetector({
              formats: ["qr_code", "ean_13", "ean_8", "code_128", "code_39", "upc_a", "upc_e"],
            });
            const barcodes = await detector.detect(videoRef.current);
            if (barcodes && barcodes.length > 0) {
              const detectedCode = barcodes[0].rawValue;
              setQrDetected(detectedCode);
              setCode(detectedCode);
              stopCamera();
              executeCodeScan(detectedCode);
            }
          } catch (err) {
            // Ignore frame detection failures
          }
        }
      }, 500);
    }

    return () => {
      if (scanInterval) clearInterval(scanInterval);
    };
  }, [cameraOn, isScanning]);

  // --- Image Processing & Barcode/QR Extraction ---
  const processImageFile = async (fileToUpload: File) => {
    setIsScanning(true);
    setError(null);
    setResult(null);

    // Try extracting QR Code / Barcode from the uploaded image first
    if ("BarcodeDetector" in window) {
      try {
        const detector = new (window as any).BarcodeDetector({
          formats: ["qr_code", "ean_13", "ean_8", "code_128", "code_39", "upc_a", "upc_e"],
        });
        const imgBitmap = await createImageBitmap(fileToUpload);
        const barcodes = await detector.detect(imgBitmap);
        if (barcodes && barcodes.length > 0) {
          const detected = barcodes[0].rawValue;
          setCode(detected);
          setQrDetected(detected);
        }
      } catch (err) {
        console.log("Image QR extraction fallback:", err);
      }
    }

    try {
      const formData = new FormData();
      formData.append("file", fileToUpload);

      const res = await fetch(`${endpoints.ai}/scan`, {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setResult(data.data);
      } else {
        setError(data.detail || "Failed to scan image. Please try another photo.");
      }
    } catch (err) {
      setError("Network error occurred during image scan.");
    } finally {
      setIsScanning(false);
    }
  };

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file (PNG, JPG, WEBP).");
      return;
    }
    setFileName(file.name);
    setSelectedFile(file);
    const previewUrl = URL.createObjectURL(file);
    setImagePreview(previewUrl);
    processImageFile(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  // --- Drag and Drop Handlers ---
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      handleFileSelect(file);
    }
  };

  const clearSelection = () => {
    setSelectedFile(null);
    setFileName(null);
    setImagePreview(null);
    setResult(null);
    setError(null);
    setCode("");
    setQrDetected(null);
  };

  // --- Code Scan Submission ---
  const executeCodeScan = async (codeToScan: string) => {
    setIsScanning(true);
    setError(null);
    try {
      let finalCode = codeToScan.trim();
      // If code is a GS1 QR URL or contains GTIN barcode (e.g. https://id.gs1.org/01/03017620422003)
      const digitMatches = finalCode.match(/\d{8,14}/g);
      if (digitMatches && (finalCode.startsWith("http") || finalCode.includes("/"))) {
        const gtin = digitMatches.find((m) => [8, 12, 13, 14].includes(m.length)) || digitMatches[0];
        finalCode = gtin;
      }

      const formData = new FormData();
      formData.append("code", finalCode);
      const res = await fetch(`${endpoints.ai}/scan`, {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setResult(data.data);
      } else {
        setError(data.detail || "Failed to analyze code.");
      }
    } catch (err) {
      setError("Network error occurred during code scan.");
    } finally {
      setIsScanning(false);
    }
  };

  // --- Manual / Camera Frame Capture Scan ---
  const scan = async () => {
    if (selectedFile) {
      await processImageFile(selectedFile);
      return;
    }

    if (code) {
      await executeCodeScan(code);
      return;
    }

    if (cameraOn && videoRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current || document.createElement("canvas");
      canvasRef.current = canvas;
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        setFileName("camera-frame.jpg");
        canvas.toBlob((blob) => {
          if (blob) {
            const capturedFile = new File([blob], "camera-frame.jpg", { type: "image/jpeg" });
            const previewUrl = URL.createObjectURL(capturedFile);
            setImagePreview(previewUrl);
            setSelectedFile(capturedFile);
            processImageFile(capturedFile);
          }
        }, "image/jpeg");
      }
    } else {
      setError("Please drop an image, turn on the camera, or enter a barcode/QR code first.");
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 via-white to-emerald-50 p-4 sm:p-6 overflow-x-hidden font-sans">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-2 mb-8">
          <div className="inline-flex items-center space-x-2 px-3 py-1 bg-emerald-100/80 text-emerald-800 rounded-full text-xs font-semibold uppercase tracking-wider">
            <Zap className="h-3.5 w-3.5" />
            <span>AI Powered Food & QR Scanner</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Food & QR Code Scanner
          </h1>
          <p className="text-slate-600 max-w-md mx-auto text-sm sm:text-base">
            Instantly scan QR codes, barcodes, or drag & drop food photos to analyze nutritional & Ayurvedic properties.
          </p>
        </div>

        {/* Mode Navigation Tabs */}
        <div className="flex justify-center border-b border-slate-200 pb-2 gap-2 sm:gap-4">
          <button
            onClick={() => {
              stopCamera();
              setActiveTab("upload");
            }}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 ${
              activeTab === "upload"
                ? "bg-slate-900 text-white shadow-md"
                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            <UploadCloud className="h-4 w-4" />
            <span>Drag & Drop / Upload</span>
          </button>
          
          <button
            onClick={startCamera}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 ${
              activeTab === "camera"
                ? "bg-slate-900 text-white shadow-md"
                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            <Camera className="h-4 w-4" />
            <span>Live Camera Scanner</span>
          </button>

          <button
            onClick={() => {
              stopCamera();
              setActiveTab("manual");
            }}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 ${
              activeTab === "manual"
                ? "bg-slate-900 text-white shadow-md"
                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            <QrCode className="h-4 w-4" />
            <span>Barcode / QR Text</span>
          </button>
        </div>

        {/* Main Card */}
        <Card className="border-0 shadow-xl overflow-hidden bg-white/90 backdrop-blur-sm rounded-3xl">
          <CardHeader className="bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-emerald-500/10 border-b border-slate-100 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-emerald-600 text-white rounded-2xl shadow-lg shadow-emerald-600/20">
                  <ScanLine className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle className="text-xl font-bold text-slate-900">
                    {activeTab === "upload" && "Drag & Drop Image Scanner"}
                    {activeTab === "camera" && "Live Camera & QR Detector"}
                    {activeTab === "manual" && "Manual Code Lookup"}
                  </CardTitle>
                  <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                    {activeTab === "upload" && "Drop food photos or QR code images here"}
                    {activeTab === "camera" && "Point your camera at a food item or QR code"}
                    {activeTab === "manual" && "Enter barcode digits or QR text string"}
                  </p>
                </div>
              </div>
              {selectedFile && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={clearSelection}
                  className="text-slate-400 hover:text-red-500 rounded-full"
                >
                  <X className="h-5 w-5" />
                </Button>
              )}
            </div>
          </CardHeader>

          <CardContent className="p-6">
            
            {/* --- TAB 1: DRAG & DROP ZONE --- */}
            {activeTab === "upload" && (
              <div className="space-y-4">
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`relative cursor-pointer rounded-3xl border-2 border-dashed p-8 text-center transition-all duration-300 ${
                    isDragging
                      ? "border-emerald-500 bg-emerald-50/80 scale-[1.01] shadow-lg"
                      : imagePreview
                      ? "border-emerald-200 bg-emerald-50/30"
                      : "border-slate-300 bg-slate-50/50 hover:bg-slate-100/80 hover:border-slate-400"
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileInputChange}
                  />

                  {imagePreview ? (
                    <div className="space-y-4">
                      <div className="relative mx-auto h-48 w-48 overflow-hidden rounded-2xl border-4 border-white shadow-xl">
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="h-full w-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            clearSelection();
                          }}
                          className="absolute top-2 right-2 bg-slate-900/80 text-white p-1.5 rounded-full hover:bg-red-600 transition-colors"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="space-y-1">
                        <p className="font-semibold text-slate-800">{fileName}</p>
                        <p className="text-xs text-emerald-600 font-medium">Click or drop another image to replace</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4 py-6">
                      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-emerald-100 text-emerald-600 shadow-md">
                        <UploadCloud className="h-10 w-10 animate-bounce" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-lg font-bold text-slate-800">
                          {isDragging ? "Drop your image here" : "Drag and drop your food / QR image here"}
                        </p>
                        <p className="text-xs sm:text-sm text-slate-500">
                          Supports PNG, JPG, WEBP • Automatically detects QR codes & Food items
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        className="rounded-full border-slate-300 px-6 font-medium text-slate-700 hover:bg-slate-900 hover:text-white transition-colors"
                      >
                        Browse Files
                      </Button>
                    </div>
                  )}
                </div>

                {/* Scan Action Button */}
                {selectedFile && (
                  <Button
                    onClick={scan}
                    disabled={isScanning}
                    className="w-full h-12 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-base shadow-lg shadow-emerald-600/20"
                  >
                    {isScanning ? (
                      <span className="flex items-center space-x-2">
                        <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Analyzing Image & QR Code...</span>
                      </span>
                    ) : (
                      <span className="flex items-center space-x-2">
                        <Sparkles className="h-5 w-5" />
                        <span>Scan & Analyze Image</span>
                      </span>
                    )}
                  </Button>
                )}
              </div>
            )}

            {/* --- TAB 2: LIVE CAMERA SCANNER --- */}
            {activeTab === "camera" && (
              <div className="space-y-4">
                <div className="relative aspect-video overflow-hidden rounded-3xl bg-slate-950 border border-slate-800 shadow-inner flex items-center justify-center">
                  {!cameraOn ? (
                    <div className="text-center space-y-4 p-8">
                      <div className="mx-auto h-16 w-16 rounded-full bg-slate-900 text-slate-400 flex items-center justify-center">
                        <CameraOff className="h-8 w-8" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-semibold text-white">Camera is turned off</h4>
                        <p className="text-xs text-slate-400">Click below to start live QR & food scanning</p>
                      </div>
                      <Button
                        onClick={startCamera}
                        className="rounded-full bg-emerald-600 hover:bg-emerald-700 text-white px-6 font-medium"
                      >
                        <Camera className="mr-2 h-4 w-4" />
                        Start Live Camera
                      </Button>
                    </div>
                  ) : (
                    <div className="relative h-full w-full">
                      <video
                        ref={videoRef}
                        className="h-full w-full object-cover"
                        muted
                        playsInline
                      />
                      
                      {/* QR Viewfinder Target Frame Overlay */}
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="h-64 w-64 rounded-3xl border-2 border-emerald-400/80 bg-emerald-500/10 shadow-[0_0_30px_rgba(52,211,153,0.3)] relative animate-pulse flex items-center justify-center">
                          <div className="absolute top-2 left-2 w-6 h-6 border-t-4 border-l-4 border-emerald-400 rounded-tl-lg" />
                          <div className="absolute top-2 right-2 w-6 h-6 border-t-4 border-r-4 border-emerald-400 rounded-tr-lg" />
                          <div className="absolute bottom-2 left-2 w-6 h-6 border-b-4 border-l-4 border-emerald-400 rounded-bl-lg" />
                          <div className="absolute bottom-2 right-2 w-6 h-6 border-b-4 border-r-4 border-emerald-400 rounded-br-lg" />
                          <div className="text-xs text-emerald-300 bg-slate-900/80 px-3 py-1 rounded-full border border-emerald-400/30">
                            Align QR / Barcode / Food here
                          </div>
                        </div>
                      </div>

                      {/* Top Status Indicator */}
                      <div className="absolute top-4 left-4 bg-slate-900/80 backdrop-blur-md text-white text-xs font-semibold px-3 py-1.5 rounded-full flex items-center space-x-2 border border-slate-700">
                        <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                        <span>Live Scanner Active</span>
                      </div>
                    </div>
                  )}
                </div>

                {cameraOn && (
                  <div className="flex justify-center space-x-3">
                    <Button
                      onClick={scan}
                      disabled={isScanning}
                      className="rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-6 h-12"
                    >
                      {isScanning ? (
                        <span className="flex items-center space-x-2">
                          <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Analyzing Frame...</span>
                        </span>
                      ) : (
                        <span className="flex items-center space-x-2">
                          <Camera className="h-4 w-4" />
                          <span>Capture Frame & Scan</span>
                        </span>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={stopCamera}
                      className="rounded-2xl border-slate-300 text-slate-700 hover:bg-slate-100 h-12 px-6"
                    >
                      Stop Camera
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* --- TAB 3: MANUAL BARCODE / QR TEXT --- */}
            {activeTab === "manual" && (
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Barcode or QR Code Data</label>
                  <div className="flex space-x-2">
                    <Input
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      placeholder="Paste QR code string or enter numeric barcode (e.g., 8901030623401)..."
                      className="flex-1 h-12 rounded-2xl border-slate-300 text-base px-4"
                    />
                    <Button
                      onClick={scan}
                      disabled={isScanning || !code}
                      className="h-12 px-6 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-medium"
                    >
                      {isScanning ? "Scanning..." : "Lookup"}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* QR Code Detected Notification */}
            {qrDetected && (
              <div className="mt-4 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center space-x-3 text-emerald-800 text-sm">
                <QrCode className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                <div className="flex-1 overflow-hidden">
                  <p className="font-semibold">QR / Barcode Detected:</p>
                  <p className="truncate text-xs font-mono text-emerald-700">{qrDetected}</p>
                </div>
              </div>
            )}

            {/* Error Banner */}
            {error && (
              <div className="mt-4 p-4 rounded-2xl bg-red-50 border border-red-200 flex items-center space-x-3 text-red-700 text-sm">
                <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
                <p>{error}</p>
              </div>
            )}

          </CardContent>
        </Card>

        {/* --- RESULT DISPLAY CARD --- */}
        {result && (
          <Card className="border-0 shadow-2xl overflow-hidden bg-white rounded-3xl animate-in fade-in slide-in-from-bottom-4 duration-300">
            <CardHeader className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start space-x-3">
                  <div className="p-3 bg-white/20 backdrop-blur-md rounded-2xl mt-1">
                    <CheckCircle2 className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <span className="inline-block px-2.5 py-0.5 bg-white/20 text-emerald-100 rounded-full text-xs font-semibold uppercase tracking-wider mb-1">
                      Scanned Product
                    </span>
                    <CardTitle className="text-2xl sm:text-3xl font-extrabold text-white leading-tight">
                      {result.name}
                    </CardTitle>
                    {result.qty && (
                      <p className="text-emerald-100 text-sm font-medium mt-1">
                        Serving / Quantity: <span className="text-white font-bold">{result.qty}</span>
                      </p>
                    )}
                  </div>
                </div>

                {result.kcal !== undefined && (
                  <div className="bg-white/20 backdrop-blur-md px-5 py-3 rounded-2xl text-center sm:text-right flex-shrink-0">
                    <span className="block text-3xl font-black text-white">{result.kcal}</span>
                    <span className="text-xs uppercase tracking-wider text-emerald-100 font-semibold">Calories</span>
                  </div>
                )}
              </div>
            </CardHeader>
            
            <CardContent className="p-6 space-y-6">
              {/* Product Info Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <div>
                  <span className="text-xs font-bold uppercase text-slate-400">Product Name</span>
                  <p className="text-slate-800 font-bold text-base mt-0.5">{result.name}</p>
                </div>
                <div>
                  <span className="text-xs font-bold uppercase text-slate-400">Scanned Barcode / QR</span>
                  <p className="text-slate-800 font-mono font-semibold text-sm mt-0.5">
                    {code || qrDetected || fileName || "Database Match"}
                  </p>
                </div>
              </div>

              {/* Macronutrients Grid */}
              {(result.protein !== undefined || result.carbs !== undefined || result.fat !== undefined) && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Macronutrients Breakdown
                  </h4>
                  <div className="grid grid-cols-3 gap-3">
                    {result.protein !== undefined && (
                      <div className="bg-emerald-50/60 p-3.5 rounded-2xl border border-emerald-100/60 text-center">
                        <span className="block text-xs font-semibold text-emerald-700 uppercase">Protein</span>
                        <span className="text-xl font-bold text-slate-800">{result.protein}g</span>
                      </div>
                    )}
                    {result.carbs !== undefined && (
                      <div className="bg-amber-50/60 p-3.5 rounded-2xl border border-amber-100/60 text-center">
                        <span className="block text-xs font-semibold text-amber-700 uppercase">Carbs</span>
                        <span className="text-xl font-bold text-slate-800">{result.carbs}g</span>
                      </div>
                    )}
                    {result.fat !== undefined && (
                      <div className="bg-rose-50/60 p-3.5 rounded-2xl border border-rose-100/60 text-center">
                        <span className="block text-xs font-semibold text-rose-700 uppercase">Fat</span>
                        <span className="text-xl font-bold text-slate-800">{result.fat}g</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Ingredients List */}
              {result.ingredients && (
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Ingredients List
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-normal">
                    {result.ingredients}
                  </p>
                </div>
              )}

              {/* Category Tags */}
              {result.tags && result.tags.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Categories & Tags
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {result.tags.map((tag, i) => (
                      <Badge
                        key={i}
                        className="bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200/60 px-3.5 py-1.5 rounded-xl text-sm font-semibold"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Toolbar */}
              <div className="flex justify-between items-center pt-2 border-t border-slate-100 text-xs text-slate-400">
                <span>Scanned Item: <strong className="text-slate-600">{result.name}</strong></span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearSelection}
                  className="text-slate-600 hover:text-slate-900 rounded-full"
                >
                  <RotateCcw className="h-3.5 w-3.5 mr-1" />
                  Scan Another Item
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

      </div>
    </div>
  );
}
