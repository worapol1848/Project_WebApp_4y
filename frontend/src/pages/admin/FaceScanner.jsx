// code in this file is written by worapol สุดหล่อ
import React, { useEffect, useRef, useState } from 'react';
import * as faceapi from '@vladmandic/face-api';
import { useNavigate, useParams } from 'react-router-dom';
import { Box, Typography, Paper, CircularProgress, Dialog, DialogContent, DialogActions, Button, Zoom } from '@mui/material';
import api from '../../services/api';

const FaceScanner = () => {
  const { userId } = useParams();
  const videoRef = useRef();
  const canvasContainerRef = useRef();
  const navigate = useNavigate();

  const [initializing, setInitializing] = useState(true);
  const [faceData, setFaceData] = useState(null);
  const [scanSuccess, setScanSuccess] = useState(false);
  const [scanError, setScanError] = useState(false);
  const [isCapturing, setIsCapturing] = useState(true);
  const [statusMessage, setStatusMessage] = useState('กำลังเตรียมระบบ...');
  const [modelsLoaded, setModelsLoaded] = useState(false);

  // Refs for tracking detection state across frames - by worapol สุดหล่อ
  const successStartTimeRef = useRef(null);
  const lastFailTimeRef = useRef(null);

  useEffect(() => {
    const init = async () => {
      try {
        const MODEL_URL = '/models';
        await Promise.all([
          faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        ]);
        setModelsLoaded(true);

        if (!userId) {
          const res = await api.get('/auth/face-data');
          if (res.data.face_descriptor) {
            setFaceData(res.data.face_descriptor);
          }
        }

        setInitializing(false);
        setStatusMessage('กำลังเปิดกล้อง...');
        startVideo();
      } catch (err) {
        console.error("Initialization error:", err);
        setStatusMessage('เกิดข้อผิดพลาดในการโหลด AI');
      }
    };
    init();

    return () => stopStream();
  }, [userId]);

  const startVideo = () => {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: "user"
        }
      })
        .then((stream) => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        })
        .catch((err) => {
          console.error("Camera error:", err);
          setStatusMessage('ไม่พบกล้อง หรือกล้องถูกปฏิเสธ');
        });
    }
  };

  const stopStream = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
  };

  const handleVideoOnPlay = () => {
    if (!videoRef.current || !canvasContainerRef.current || !modelsLoaded) return;

    // Create/Reset Canvas - by worapol สุดหล่อ
    const canvas = faceapi.createCanvasFromMedia(videoRef.current);
    canvasContainerRef.current.innerHTML = '';
    canvas.style.position = 'absolute';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvasContainerRef.current.append(canvas);

    // matchDimensions to the actual display size of the video element - by worapol สุดหล่อ
    const displaySize = {
      width: videoRef.current.offsetWidth,
      height: videoRef.current.offsetHeight
    };
    faceapi.matchDimensions(canvas, displaySize);

    let faceMatcher = null;
    if (faceData && !userId) {
      try {
        const parsed = new Float32Array(JSON.parse(faceData));
        const labeledDescriptor = new faceapi.LabeledFaceDescriptors('Target', [parsed]);
        faceMatcher = new faceapi.FaceMatcher([labeledDescriptor], 0.55);
      } catch (e) {
        console.error("Matcher setup error:", e);
      }
    }

    const runDetection = async () => {
      if (!isCapturing || !videoRef.current || videoRef.current.paused) return;

      const detections = await faceapi.detectSingleFace(videoRef.current).withFaceLandmarks().withFaceDescriptor();
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (detections) {
        // Alignment Fix: Resize based on the current offsetWidth/Height of the video - by worapol สุดหล่อ
        const currentDisplaySize = { width: videoRef.current.offsetWidth, height: videoRef.current.offsetHeight };
        if (canvas.width !== currentDisplaySize.width || canvas.height !== currentDisplaySize.height) {
          faceapi.matchDimensions(canvas, currentDisplaySize);
        }

        const resizedDetections = faceapi.resizeResults(detections, currentDisplaySize);
        const box = resizedDetections.detection.box;

        // --- MODE 1: Enrollment/Registration --- - by worapol สุดหล่อ
        if (userId || !faceData) {
          if (!successStartTimeRef.current) successStartTimeRef.current = Date.now();
          const elapsed = Math.floor((Date.now() - successStartTimeRef.current) / 1000);
          const remaining = 3 - elapsed;

          if (remaining <= 0) {
            setStatusMessage('ตรวจจับใบหน้าได้แล้ว!');
            new faceapi.draw.DrawBox(box, { label: 'Face Confirmed', boxColor: '#10B981' }).draw(canvas);

            setIsCapturing(false);
            setTimeout(async () => {
              const msg = userId ? `ยืนยันบันทึกใบหน้าให้แอดมิน ID: ${userId}?` : "บันทึกใบหน้านี้เป็นใบหน้าของคุณ?";
              if (window.confirm(msg)) {
                try {
                  const endpoint = userId ? `/auth/admins/${userId}/face-data` : '/auth/face-data';
                  await api.put(endpoint, { face_descriptor: Array.from(detections.descriptor) });
                  alert("✅ บันทึกสำเร็จ");
                  stopStream();
                  navigate(`/superadmin/manage?editId=${userId}`);
                } catch (err) {
                  alert("ผิดพลาด!");
                  setIsCapturing(true);
                  successStartTimeRef.current = null;
                  runDetection();
                }
              } else {
                setIsCapturing(true);
                successStartTimeRef.current = null;
                runDetection();
              }
            }, 500);
            return;
          } else {
            setStatusMessage(userId ? `ลงทะเบียน Admin #${userId}... กรุณานิ่งไว้` : 'ลงทะเบียนใบหน้าใหม่...');
            new faceapi.draw.DrawBox(box, {
              label: `Scanning (${remaining}s)`,
              boxColor: '#8B5CF6'
            }).draw(canvas);
          }
        }

        // --- MODE 2: Verification --- - by worapol สุดหล่อ
        else if (faceMatcher) {
          const match = faceMatcher.findBestMatch(detections.descriptor);
          if (match.label === 'Target') {
            lastFailTimeRef.current = null;
            if (!successStartTimeRef.current) successStartTimeRef.current = Date.now();
            const elapsed = Math.floor((Date.now() - successStartTimeRef.current) / 1000);
            const remaining = 3 - elapsed;

            if (remaining <= 0) {
              setStatusMessage('ยืนยันตัวตนสำเร็จ!');
              new faceapi.draw.DrawBox(box, { label: 'Correct Face', boxColor: '#10B981', lineWidth: 4 }).draw(canvas);
              setIsCapturing(false);
              stopStream();
              setScanSuccess(true);
              return;
            } else {
              setStatusMessage(`กรุณามองกล้องค้างไว้... ${remaining} วินาที`);
              new faceapi.draw.DrawBox(box, { label: `Verifying (${remaining}s)`, boxColor: '#F59E0B' }).draw(canvas);
            }
          } else {
            successStartTimeRef.current = null;
            new faceapi.draw.DrawBox(box, { label: 'Wrong Identity', boxColor: '#EF4444' }).draw(canvas);
            if (!lastFailTimeRef.current) lastFailTimeRef.current = Date.now();
            const elapsed = Math.floor((Date.now() - lastFailTimeRef.current) / 1000);
            const remaining = 30 - elapsed;
            if (remaining <= 0) {
              setIsCapturing(false);
              stopStream();
              setScanError(true);
              return;
            } else {
              setStatusMessage(`ไม่ใช่เจ้าของเครื่อง! จะล็อคใน ${remaining} วินาที`);
            }
          }
        }
      } else {
        // Face lost - by worapol สุดหล่อ
        successStartTimeRef.current = null;
        if (lastFailTimeRef.current) {
          const elapsed = Math.floor((Date.now() - lastFailTimeRef.current) / 1000);
          const remaining = 30 - elapsed;
          if (remaining <= 0) {
            setIsCapturing(false);
            stopStream();
            setScanError(true);
            return;
          }
          setStatusMessage(`ไม่พบใบหน้า... (${remaining}s)`);
        } else {
          setStatusMessage('กรุณาวางใบหน้าให้ตรงกรอบ');
        }
      }

      if (isCapturing) {
        requestAnimationFrame(runDetection);
      }
    };

    requestAnimationFrame(runDetection);
  };

  const handleRetry = () => {
    setScanError(false);
    setIsCapturing(true);
    successStartTimeRef.current = null;
    lastFailTimeRef.current = null;
    startVideo();
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', p: 3 }}>
      <Paper elevation={0} sx={{ p: 4, borderRadius: '32px', width: '100%', maxWidth: '600px', textAlign: 'center', border: '1px solid #e2e8f0' }}>
        <Typography variant="h4" fontWeight="900" sx={{ color: '#0f172a', mb: 1 }}>Face Security</Typography>
        <Typography variant="body2" sx={{ color: '#64748b', mb: 4 }}>ยืนยันตัวตนด้วย Biometric (3 วินาที)</Typography>

        <Box sx={{ position: 'relative', width: '100%', aspectRatio: '4/3', bgcolor: '#000', borderRadius: '24px', overflow: 'hidden' }}>
          {initializing && (
            <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 10, bgcolor: 'rgba(255,255,255,0.9)' }}>
              <CircularProgress size={40} thickness={4} sx={{ color: '#6366f1', mb: 2 }} />
              <Typography variant="caption" sx={{ color: '#64748b' }}>กำลังปรับปรุงระบบสแกน...</Typography>
            </Box>
          )}
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            onPlay={handleVideoOnPlay}
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
          />
          <Box ref={canvasContainerRef} sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }} />
        </Box>

        <Box sx={{ mt: 3, p: 2, borderRadius: '16px', bgcolor: '#f1f5f9', border: '1px solid #e2e8f0' }}>
          <Typography variant="body1" sx={{ color: '#334155', fontWeight: '900' }}>{statusMessage}</Typography>
        </Box>
      </Paper>

      {/* Success Dialog */}
      <Dialog open={scanSuccess} TransitionComponent={Zoom}>
        <DialogContent sx={{ textAlign: 'center', p: 6 }}>
          <Typography variant="h4" fontWeight="1000" sx={{ color: '#10b981', mb: 1 }}>สำเร็จ!</Typography>
          <Typography sx={{ color: '#374151' }}>ระบบยืนยันตัวตนเรียบร้อยแล้ว</Typography>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 4 }}>
          <Button variant="contained" onClick={() => navigate(`/superadmin/manage${userId ? `?editId=${userId}` : ''}`)} sx={{ bgcolor: '#10b981', px: 6, py: 1.5, borderRadius: '12px' }}>ตกลง</Button>
        </DialogActions>
      </Dialog>

      {/* Error Dialog */}
      <Dialog open={scanError} TransitionComponent={Zoom}>
        <DialogContent sx={{ textAlign: 'center', p: 6 }}>
          <Typography variant="h5" fontWeight="900" sx={{ color: '#ef4444', mb: 1 }}>ไม่สำเร็จ</Typography>
          <Typography sx={{ color: '#374151' }}>ไม่สะดวกลงทะเบียนหรือใบหน้าไม่ตรง</Typography>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', gap: 2, pb: 4 }}>
          <Button variant="outlined" onClick={() => navigate('/login')}>กลับ</Button>
          <Button variant="contained" onClick={handleRetry} sx={{ bgcolor: '#ef4444' }}>ลองใหม่</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default FaceScanner;
