
import React, { useRef, useState, useCallback, useEffect } from 'react';
import { CameraIcon } from './icons';
import DarkModeIcon from './DarkModeIcon';

interface ImageUploaderProps {
  onImageUpload: (dataUrl: string) => void;
  imagePreviewUrl: string | null;
  isDarkMode?: boolean;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ 
  onImageUpload, 
  imagePreviewUrl, 
  isDarkMode = false 
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isCamera, setIsCamera] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');

  // Effect to handle video stream assignment
  useEffect(() => {
    if (stream && videoRef.current && isCamera) {
      const video = videoRef.current;
      
      // Clear existing source
      video.srcObject = null;
      
      // Set new source
      video.srcObject = stream;
      
      // Force load and play
      video.load();
      
      const playVideo = async () => {
        try {
          await video.play();
        } catch (err) {
          console.error('Video play failed:', err);
        }
      };
      
      if (video.readyState >= 1) {
        playVideo();
      } else {
        video.addEventListener('loadedmetadata', playVideo, { once: true });
      }
    }
  }, [stream, isCamera]);

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
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select a valid image file');
        return;
      }
      
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setError('Image file is too large. Please select an image smaller than 10MB');
        return;
      }
      
      setError(null); // Clear any previous errors
      
      const reader = new FileReader();
      reader.onloadend = () => {
        try {
          const result = reader.result as string;
          if (result && result.startsWith('data:image/')) {
            onImageUpload(result);
          } else {
            setError('Failed to process image. Please try again.');
          }
        } catch (error) {
          console.error('Error processing image:', error);
          setError('Failed to process image. Please try again.');
        }
      };
      reader.onerror = () => {
        setError('Failed to read image file. Please try again.');
      };
      reader.readAsDataURL(file);
    }
    
    // Clear the input value to allow re-uploading the same file
    if (event.target) {
      event.target.value = '';
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const startCamera = useCallback(async () => {
    try {
      setError(null);
      
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera API not supported in this browser');
      }
      
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 }
        }
      });
      
      setStream(mediaStream);
      setIsCamera(true);
      
      if (videoRef.current) {
        videoRef.current.srcObject = null;
        
        setTimeout(() => {
          if (videoRef.current) {
            videoRef.current.srcObject = mediaStream;
            videoRef.current.load();
            
            videoRef.current.onloadedmetadata = () => {
              if (videoRef.current) {
                videoRef.current.play().catch(err => {
                  console.error('Video play failed:', err);
                  setError('Failed to start video playback. Please try again.');
                });
              }
            };
            
            videoRef.current.oncanplay = () => {
              if (videoRef.current && videoRef.current.paused) {
                videoRef.current.play().catch(console.error);
              }
            };
            
            videoRef.current.onerror = () => {
              setError('Video error occurred. Please try again.');
            };
          }
        }, 50);
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

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsCamera(false);
    setError(null);
  }, [stream]);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) {
      setError('Camera not ready. Please try again.');
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) {
      setError('Failed to initialize capture. Please try again.');
      return;
    }

    try {
      // Check if video is ready
      if (video.videoWidth === 0 || video.videoHeight === 0) {
        setError('Camera not ready. Please wait and try again.');
        return;
      }

      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Draw the video frame to canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Convert to data URL with error handling
      try {
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        
        if (dataUrl && dataUrl.startsWith('data:image/')) {
          onImageUpload(dataUrl);
          stopCamera();
          setError(null);
        } else {
          setError('Failed to capture image. Please try again.');
        }
      } catch (captureError) {
        console.error('Error capturing image:', captureError);
        setError('Failed to capture image. Please try again.');
      }
    } catch (error) {
      console.error('Error during photo capture:', error);
      setError('Camera capture failed. Please try again.');
    }
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
              muted
              playsInline
              controls={false}
              style={{ 
                width: '100%', 
                height: '100%', 
                objectFit: 'cover',
                backgroundColor: 'black'
              }}
            />
            {error && (
              <div className="absolute inset-0 bg-red-100 flex items-center justify-center">
                <p className="text-red-600 text-center p-4">{error}</p>
              </div>
            )}
          </div>
          
          {/* Camera controls */}
          <div className="flex flex-col sm:flex-row justify-center gap-2 sm:gap-4 mt-4">
            <button
              onClick={capturePhoto}
              disabled={!stream}
              className="px-4 sm:px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-semibold flex items-center justify-center gap-2 transition-all duration-200 active:scale-95"
            >
              <CameraIcon className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="text-sm sm:text-base">Capture</span>
            </button>
            
            <button
              onClick={async () => {
                if (stream) {
                  // Stop current stream
                  stream.getTracks().forEach(track => track.stop());
                  setStream(null);
                }
                
                // Switch facing mode
                const newFacingMode = facingMode === 'user' ? 'environment' : 'user';
                setFacingMode(newFacingMode);
                
                // Start camera with new facing mode immediately
                try {
                  setError(null);
                  
                  const mediaStream = await navigator.mediaDevices.getUserMedia({
                    video: {
                      facingMode: newFacingMode,
                      width: { ideal: 1280, max: 1920 },
                      height: { ideal: 720, max: 1080 }
                    }
                  });
                  
                  setStream(mediaStream);
                  
                  if (videoRef.current) {
                    videoRef.current.srcObject = null;
                    
                    setTimeout(() => {
                      if (videoRef.current) {
                        videoRef.current.srcObject = mediaStream;
                        videoRef.current.load();
                        
                        videoRef.current.onloadedmetadata = () => {
                          if (videoRef.current) {
                            videoRef.current.play().catch(err => {
                              console.error('Video play failed:', err);
                              setError('Failed to start video playback. Please try again.');
                            });
                          }
                        };
                      }
                    }, 50);
                  }
                } catch (err) {
                  console.error('Error switching camera:', err);
                  setError('Failed to switch camera. Please try again.');
                }
              }}
              disabled={!stream}
              className="px-3 sm:px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-semibold transition-all duration-200 active:scale-95 text-sm sm:text-base"
            >
              Flip
            </button>
            
            <button
              onClick={stopCamera}
              className="px-4 sm:px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-semibold transition-all duration-200 active:scale-95 text-sm sm:text-base"
            >
              Stop
            </button>
          </div>
        </div>
      ) : (
        <div className="w-full">
          {/* Image preview or upload area */}
          <div
            className="w-full aspect-video bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:bg-gray-200 hover:border-gray-400 transition-colors touch-manipulation"
            onClick={triggerFileInput}
          >
            {imagePreviewUrl ? (
              <img src={imagePreviewUrl} alt="Meal preview" className="w-full h-full object-cover rounded-lg" />
            ) : (
              <div className="text-center text-gray-500 p-4">
                <CameraIcon className="w-8 h-8 sm:w-12 sm:h-12 mx-auto text-gray-400" />
                <p className="mt-2 font-semibold text-sm sm:text-base">Tap to upload a photo</p>
                <p className="text-xs sm:text-sm">PNG, JPG, or WEBP</p>
              </div>
            )}
          </div>
          
          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row justify-center gap-2 sm:gap-4 mt-4">
            <button
              onClick={triggerFileInput}
              className="px-4 sm:px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold flex items-center justify-center gap-2 transition-all duration-200 active:scale-95"
            >
              <DarkModeIcon src="/file-upload-svgrepo-com.svg" alt="Upload" className="w-4 h-4 sm:w-5 sm:h-5" isDarkMode={false} invertInDarkMode={true} />
              <span className="text-sm sm:text-base">Upload File</span>
            </button>
            <button
              onClick={startCamera}
              className="px-4 sm:px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold flex items-center justify-center gap-2 transition-all duration-200 active:scale-95"
            >
              <CameraIcon className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="text-sm sm:text-base">Use Camera</span>
            </button>
          </div>
          
          {error && (
            <div className="mt-4 p-3 bg-red-100 border border-red-300 rounded-lg text-red-700">
              <p className="font-semibold">Camera Error:</p>
              <p>{error}</p>
              <p className="text-xs mt-1">
                💡 Try: Allow camera permissions, use Chrome/Firefox, or check camera isn't used by another app
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ImageUploader;
