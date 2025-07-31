
import React, { useRef, useState, useCallback, useEffect } from 'react';
import { CameraIcon } from './icons';

interface ImageUploaderProps {
  onImageUpload: (dataUrl: string) => void;
  imagePreviewUrl: string | null;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageUpload, imagePreviewUrl }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isCamera, setIsCamera] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');

  // Cleanup camera stream on component unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onImageUpload(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const startCamera = useCallback(async () => {
    try {
      setError(null);
      console.log('Starting camera...');
      
      // Check if navigator.mediaDevices is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera API not supported in this browser');
      }
      
      console.log('Requesting camera access...');
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode, // Use the current facing mode
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 }
        }
      });
      
      console.log('Camera access granted, setting up stream...');
      setStream(mediaStream);
      setIsCamera(true);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        console.log('Video stream assigned to video element');
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      let errorMessage = 'Camera access failed. ';
      
      if (err.name === 'NotAllowedError') {
        errorMessage += 'Camera permission denied. Please allow camera access and try again.';
      } else if (err.name === 'NotFoundError') {
        errorMessage += 'No camera found on this device.';
      } else if (err.name === 'NotSupportedError') {
        errorMessage += 'Camera not supported in this browser.';
      } else {
        errorMessage += err.message || 'Unknown error occurred.';
      }
      
      setError(errorMessage);
    }
  }, [facingMode]);

  const switchCamera = useCallback(async () => {
    if (stream) {
      // Stop current stream
      stream.getTracks().forEach(track => track.stop());
    }
    
    // Switch facing mode
    const newFacingMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(newFacingMode);
    
    // Restart camera with new facing mode
    setTimeout(() => {
      startCamera();
    }, 100);
  }, [stream, facingMode, startCamera]);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsCamera(false);
    setError(null);
  }, [stream]);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw the video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert to data URL
    const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
    onImageUpload(dataUrl);
    
    // Stop camera after capture
    stopCamera();
  }, [onImageUpload, stopCamera]);

  return (
    <div className="w-full">
      <input
        type="file"
        accept="image/*"
        capture="environment"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
      />
      
      {/* Hidden canvas for photo capture */}
      <canvas ref={canvasRef} className="hidden" />
      
      {isCamera ? (
        <div className="w-full">
          {/* Camera view */}
          <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
            {error && (
              <div className="absolute inset-0 bg-red-100 flex items-center justify-center">
                <p className="text-red-600 text-center p-4">{error}</p>
              </div>
            )}
          </div>
          
          {/* Camera controls */}
          <div className="flex justify-center gap-4 mt-4">
            <button
              onClick={capturePhoto}
              disabled={!!error}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-semibold flex items-center gap-2"
            >
              <CameraIcon className="w-5 h-5" />
              Capture Photo
            </button>
            <button
              onClick={switchCamera}
              disabled={!!error}
              className="px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-semibold"
            >
              🔄 {facingMode === 'user' ? 'Front' : 'Back'}
            </button>
            <button
              onClick={stopCamera}
              className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-semibold"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="w-full">
          {/* Image preview or upload area */}
          <div
            className="w-full aspect-video bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:bg-gray-200 hover:border-gray-400 transition-colors"
            onClick={triggerFileInput}
          >
            {imagePreviewUrl ? (
              <img src={imagePreviewUrl} alt="Meal preview" className="w-full h-full object-cover rounded-lg" />
            ) : (
              <div className="text-center text-gray-500">
                <CameraIcon className="w-12 h-12 mx-auto text-gray-400" />
                <p className="mt-2 font-semibold">Click to upload a photo</p>
                <p className="text-sm">PNG, JPG, or WEBP</p>
              </div>
            )}
          </div>
          
          {/* Action buttons */}
          <div className="flex justify-center gap-4 mt-4">
            <button
              onClick={triggerFileInput}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold flex items-center gap-2"
            >
              📁 Upload File
            </button>
            <button
              onClick={startCamera}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold flex items-center gap-2"
            >
              <CameraIcon className="w-5 h-5" />
              Use Camera
            </button>
          </div>
          
          {/* Debug info */}
          <div className="mt-2 text-center text-sm text-gray-600">
            <p>Camera Support: {navigator.mediaDevices ? '✅ Available' : '❌ Not Available'}</p>
            {error && (
              <div className="mt-2 p-3 bg-red-100 border border-red-300 rounded-lg text-red-700">
                <p className="font-semibold">Camera Error:</p>
                <p>{error}</p>
                <p className="text-xs mt-1">
                  💡 Try: Allow camera permissions, use Chrome/Firefox, or check camera isn't used by another app
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageUploader;
