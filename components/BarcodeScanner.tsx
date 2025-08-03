import React, { useRef, useState, useCallback, useEffect } from 'react';
import { barcodeService, BarcodeResult, ProductData } from '../services/barcodeService';
import { LoadingSpinner } from './icons';

interface BarcodeScannerProps {
  onBarcodeDetected: (barcode: string, productData: ProductData | null) => void;
  onClose: () => void;
  isDarkMode: boolean;
}

const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ 
  onBarcodeDetected, 
  onClose, 
  isDarkMode 
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastScannedCode, setLastScannedCode] = useState<string>('');
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [scanMode, setScanMode] = useState<'1D' | 'QR'>('1D');

  // Initialize camera and barcode scanning
  const startScanning = useCallback(async () => {
    try {
      setError(null);
      setIsLoading(true);

      // Get camera stream
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        setStream(mediaStream);
        
        videoRef.current.onloadedmetadata = async () => {
          if (videoRef.current) {
            videoRef.current.play();
            
            if (scanMode === '1D') {
              // Initialize Quagga for 1D barcodes
              try {
                await barcodeService.initializeQuagga(videoRef.current);
                setupQuaggaListeners();
              } catch (err) {
                console.error('Quagga initialization failed:', err);
                setError('1D barcode scanner initialization failed. Switching to QR mode.');
                setScanMode('QR');
              }
            }
            
            setIsScanning(true);
            setIsLoading(false);
          }
        };
      }
    } catch (err) {
      setError('Camera access denied. Please allow camera permissions.');
      setIsLoading(false);
    }
  }, [scanMode]);

  // Setup Quagga barcode detection listeners
  const setupQuaggaListeners = useCallback(() => {
    // Remove existing listeners
    // @ts-ignore
    Quagga.offDetected();
    
    // @ts-ignore
    Quagga.onDetected((result) => {
      const code = result.codeResult.code;
      
      // Avoid duplicate scans
      if (code === lastScannedCode) return;
      
      if (barcodeService.isValidBarcode(code)) {
        setLastScannedCode(code);
        handleBarcodeDetected({
          code,
          format: result.codeResult.format,
          confidence: result.codeResult.confidence
        });
      }
    });
  }, [lastScannedCode]);

  // Handle QR code scanning
  const scanForQRCode = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    const imageData = barcodeService.getImageDataFromCanvas(canvas);
    if (imageData) {
      const qrResult = barcodeService.scanQRCode(imageData);
      if (qrResult && qrResult.code !== lastScannedCode) {
        setLastScannedCode(qrResult.code);
        handleBarcodeDetected(qrResult);
      }
    }
  }, [lastScannedCode]);

  // QR scanning interval
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isScanning && scanMode === 'QR') {
      interval = setInterval(scanForQRCode, 500);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isScanning, scanMode, scanForQRCode]);

  // Handle barcode detection
  const handleBarcodeDetected = async (result: BarcodeResult) => {
    try {
      setIsLoading(true);
      
      // Fetch product data from OpenFoodFacts
      const productData = await barcodeService.fetchProductData(result.code);
      
      // Call parent callback
      onBarcodeDetected(result.code, productData);
      
      // Stop scanning after successful detection
      stopScanning();
    } catch (err) {
      setError('Failed to fetch product information');
      setIsLoading(false);
    }
  };

  // Stop scanning and cleanup
  const stopScanning = useCallback(() => {
    setIsScanning(false);
    
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    
    barcodeService.stopScanning();
  }, [stream]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopScanning();
    };
  }, [stopScanning]);

  // Switch scan mode
  const toggleScanMode = () => {
    stopScanning();
    setScanMode(prev => prev === '1D' ? 'QR' : '1D');
    setLastScannedCode('');
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
      <div className={`w-full max-w-md mx-4 ${
        isDarkMode 
          ? 'bg-gray-800 border-gray-600' 
          : 'bg-white border-gray-200'
      } rounded-2xl border shadow-2xl overflow-hidden`}>
        
        {/* Header */}
        <div className={`p-4 border-b ${
          isDarkMode ? 'border-gray-600 bg-gray-700' : 'border-gray-200 bg-gray-50'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <h3 className={`text-lg font-semibold ${
                isDarkMode ? 'text-white' : 'text-gray-800'
              }`}>
                Barcode Scanner
              </h3>
              <p className={`text-sm ${
                isDarkMode ? 'text-gray-300' : 'text-gray-600'
              }`}>
                Scanning for {scanMode === '1D' ? '1D barcodes' : 'QR codes'}
              </p>
            </div>
            <button
              onClick={onClose}
              className={`p-2 rounded-lg transition-colors ${
                isDarkMode 
                  ? 'hover:bg-gray-600 text-gray-300' 
                  : 'hover:bg-gray-200 text-gray-600'
              }`}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Camera View */}
        <div className="relative">
          <video
            ref={videoRef}
            className="w-full h-64 object-cover bg-black"
            autoPlay
            muted
            playsInline
          />
          
          {/* Scanning overlay */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative">
              {/* Scanning frame */}
              <div className="w-48 h-32 border-2 border-white/50 rounded-lg relative">
                <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-green-400 rounded-tl-lg"></div>
                <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-green-400 rounded-tr-lg"></div>
                <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-green-400 rounded-bl-lg"></div>
                <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-green-400 rounded-br-lg"></div>
                
                {/* Scanning line animation */}
                {isScanning && (
                  <div className="absolute inset-0 overflow-hidden rounded-lg">
                    <div className="w-full h-0.5 bg-green-400 animate-pulse"></div>
                  </div>
                )}
              </div>
              
              {/* Instructions */}
              <p className="text-center text-white text-sm mt-2 bg-black/50 px-3 py-1 rounded-full">
                {scanMode === '1D' ? 'Align barcode within frame' : 'Point camera at QR code'}
              </p>
            </div>
          </div>

          {/* Loading overlay */}
          {isLoading && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <div className="bg-white rounded-lg p-4 flex items-center space-x-3">
                <LoadingSpinner className="w-5 h-5" />
                <span className="text-gray-800">
                  {isScanning ? 'Fetching product info...' : 'Starting camera...'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className={`p-4 space-y-3 ${
          isDarkMode ? 'bg-gray-800' : 'bg-white'
        }`}>
          
          {/* Error message */}
          {error && (
            <div className="bg-red-100 border border-red-300 text-red-700 px-3 py-2 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex space-x-3">
            {!isScanning ? (
              <button
                onClick={startScanning}
                disabled={isLoading}
                className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
              >
                Start Scanning
              </button>
            ) : (
              <button
                onClick={stopScanning}
                className="flex-1 bg-red-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-red-700 transition-colors"
              >
                Stop Scanning
              </button>
            )}
            
            <button
              onClick={toggleScanMode}
              disabled={isLoading}
              className={`px-4 py-3 rounded-lg font-semibold transition-colors ${
                isDarkMode
                  ? 'bg-gray-600 text-white hover:bg-gray-500'
                  : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
              }`}
            >
              {scanMode === '1D' ? 'QR' : '1D'}
            </button>
          </div>

          {/* Tips */}
          <div className={`text-xs ${
            isDarkMode ? 'text-gray-400' : 'text-gray-500'
          }`}>
            <p>💡 Tip: Hold steady and ensure good lighting for best results</p>
          </div>
        </div>
      </div>

      {/* Hidden canvas for QR processing */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default BarcodeScanner;
