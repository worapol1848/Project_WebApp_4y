import React, { useEffect, useRef, useState, useContext } from 'react';
import * as faceapi from '@vladmandic/face-api';
import { useNavigate, useParams } from 'react-router-dom';
import { Box, Typography, Paper, CircularProgress, Dialog, DialogContent, DialogActions, Button, Zoom, Avatar } from '@mui/material';
import { AuthContext } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext'; 
import { useLanguage } from '../../context/LanguageContext'; 
import api from '../../services/api';

const FaceScanner = () => {
  const { userId } = useParams();
  const videoRef = useRef();
  const streamRef = useRef(null);
  const canvasContainerRef = useRef();
  const navigate = useNavigate();
  const { user: currentUser } = useContext(AuthContext);
  const { showToast } = useToast(); 
  const { t } = useLanguage(); 

  const [initializing, setInitializing] = useState(true);
  const [faceData, setFaceData] = useState(null);
  const [scanSuccess, setScanSuccess] = useState(false);
  const [scanError, setScanError] = useState(false);
  const [errorType, setErrorType] = useState(null); 
  const [isCapturing, setIsCapturing] = useState(true);
  const [statusMessage, setStatusMessage] = useState('กำลังเตรียมระบบ...');
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [targetUser, setTargetUser] = useState(null);

  const successStartTimeRef = useRef(null);
  const wrongFaceStartTimeRef = useRef(null);
  const noFaceStartTimeRef = useRef(null);

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
        } else {
          try {
            const res = await api.get('/auth/admins');
            const tUser = res.data.find(a => a.id === parseInt(userId));
            if (tUser) setTargetUser(tUser);
          } catch (err) {
            console.error("Failed to fetch target user data", err);
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
          streamRef.current = stream;
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
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const handleVideoOnPlay = () => {
    if (!videoRef.current || !canvasContainerRef.current || !modelsLoaded) return;

    const canvas = faceapi.createCanvasFromMedia(videoRef.current);
    canvasContainerRef.current.innerHTML = '';
    canvas.style.position = 'absolute';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvasContainerRef.current.append(canvas);

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
        noFaceStartTimeRef.current = null;
        
        const currentDisplaySize = { width: videoRef.current.offsetWidth, height: videoRef.current.offsetHeight };
        if (canvas.width !== currentDisplaySize.width || canvas.height !== currentDisplaySize.height) {
          faceapi.matchDimensions(canvas, currentDisplaySize);
        }

        const resizedDetections = faceapi.resizeResults(detections, currentDisplaySize);
        const box = resizedDetections.detection.box;

        if (userId || !faceData) {
          if (!successStartTimeRef.current) successStartTimeRef.current = Date.now();
          const elapsed = Math.floor((Date.now() - successStartTimeRef.current) / 1000);
          const remaining = 3 - elapsed;

          if (remaining <= 0) {
            setStatusMessage('ตรวจจับใบหน้าได้แล้ว!');
            new faceapi.draw.DrawBox(box, { label: 'Face Confirmed', boxColor: '#10B981' }).draw(canvas);
            setIsCapturing(false);
            stopStream();
            setTimeout(async () => {
              const msg = userId ? `ยืนยันบันทึกใบหน้าให้แอดมิน ID: ${userId}?` : "บันทึกใบหน้านี้เป็นใบหน้าของคุณ?";
              if (window.confirm(msg)) {
                try {
                  const endpoint = userId ? `/auth/admins/${userId}/face-data` : '/auth/face-data';
                  await api.put(endpoint, { face_descriptor: Array.from(detections.descriptor) });
                  alert("✅ บันทึกสำเร็จ");
                  navigate(`/superadmin/manage?editId=${userId}`);
                } catch (err) {
                  alert("ผิดพลาด!");
                  setIsCapturing(true);
                  successStartTimeRef.current = null;
                  startVideo();
                  runDetection();
                }
              } else {
                setIsCapturing(true);
                successStartTimeRef.current = null;
                startVideo();
                runDetection();
              }
            }, 100);
            return;
          } else {
            setStatusMessage(userId ? `ลงทะเบียน Admin #${userId}... กรุณานิ่งไว้` : 'ลงทะเบียนใบหน้าใหม่...');
            new faceapi.draw.DrawBox(box, { label: `Scanning (${remaining}s)`, boxColor: '#8B5CF6' }).draw(canvas);
          }
        }

        else if (faceMatcher) {
          const match = faceMatcher.findBestMatch(detections.descriptor);
          if (match.label === 'Target') {
            wrongFaceStartTimeRef.current = null;
            if (!successStartTimeRef.current) successStartTimeRef.current = Date.now();
            const elapsed = Math.floor((Date.now() - successStartTimeRef.current) / 1000);
            const remaining = 3 - elapsed;

            if (remaining <= 0) {
              setStatusMessage('ยืนยันตัวตนสำเร็จ!');
              new faceapi.draw.DrawBox(box, { label: 'Correct Face', boxColor: '#10B981', lineWidth: 4 }).draw(canvas);
              setIsCapturing(false);
              stopStream();
              
              
              showToast(`${t('auth_login_success')}, ${currentUser?.username}!`);
              
              setScanSuccess(true);
              return;
            } else {
              setStatusMessage(`กรุณามองกล้องค้างไว้... ${remaining} วินาที`);
              new faceapi.draw.DrawBox(box, { label: `Verifying (${remaining}s)`, boxColor: '#F59E0B' }).draw(canvas);
            }
          } else {
            successStartTimeRef.current = null;
            new faceapi.draw.DrawBox(box, { label: 'Unknown Identity', boxColor: '#EF4444' }).draw(canvas);
            if (!wrongFaceStartTimeRef.current) wrongFaceStartTimeRef.current = Date.now();
            const elapsed = Math.floor((Date.now() - wrongFaceStartTimeRef.current) / 1000);
            const remaining = 5 - elapsed;
            if (remaining <= 0) {
              setIsCapturing(false);
              stopStream();
              setErrorType('wrong');
              setScanError(true);
              return;
            } else {
              setStatusMessage(`ใบหน้าไม่ถูกต้อง! จะแจ้งเตือนใน ${remaining} วินาที`);
            }
          }
        }
      } else {
        successStartTimeRef.current = null;
        wrongFaceStartTimeRef.current = null;
        if (!noFaceStartTimeRef.current) noFaceStartTimeRef.current = Date.now();
        const elapsed = Math.floor((Date.now() - noFaceStartTimeRef.current) / 1000);
        const remaining = 20 - elapsed;
        if (remaining <= 0) {
          setIsCapturing(false);
          stopStream();
          setErrorType('not_found');
          setScanError(true);
          return;
        } else {
          setStatusMessage(`ไม่พบใบหน้า... กรุณาขยับหน้าเข้าหาหน้าจอ (${remaining}s)`);
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
    setErrorType(null);
    setIsCapturing(true);
    successStartTimeRef.current = null;
    wrongFaceStartTimeRef.current = null;
    noFaceStartTimeRef.current = null;
    startVideo();
  };

  const handleBackToLogin = () => {
    stopStream();
    const searchParams = new URLSearchParams(window.location.search);
    const redirectUrl = searchParams.get('redirect');
    
    if (userId) {
      navigate(`/superadmin/manage?editId=${userId}`);
    } else if (redirectUrl) {
      navigate(redirectUrl);
    } else {
      navigate(-1); // or '/login' if they actually came from login
    }
  };

  const handleSuccessRedirect = () => {
    const searchParams = new URLSearchParams(window.location.search);
    const redirectUrl = searchParams.get('redirect');
    
    if (userId) {
      navigate(`/superadmin/manage?editId=${userId}`);
    } else if (redirectUrl) {
      navigate(redirectUrl);
    } else {
      navigate('/admin');
    }
  };

  const displayUser = targetUser || currentUser;

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#f1f5f9', p: 3 }}>
      <Paper elevation={0} sx={{ p: 4, borderRadius: '40px', width: '100%', maxWidth: '640px', textAlign: 'center', border: '1px solid #e2e8f0', position: 'relative', bgcolor: '#ffffff', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.05)' }}>
        
        <Button 
          onClick={handleBackToLogin}
          startIcon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>}
          sx={{ position: 'absolute', top: 24, left: 24, color: '#64748b', textTransform: 'none', fontWeight: 700, '&:hover': { bgcolor: '#f1f5f9', color: '#0f172a' } }}
        >
          ย้อนกลับ
        </Button>

        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3, mt: 4 }}>
          <Avatar 
            src={displayUser?.profile_image ? `http://localhost:5000${displayUser.profile_image}` : null} 
            sx={{ width: 80, height: 80, mb: 2, border: '4px solid #f1f5f9', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
          >
            {displayUser?.username?.charAt(0).toUpperCase()}
          </Avatar>
          <Typography variant="h5" fontWeight="1000" sx={{ color: '#0f172a' }}>
            {displayUser?.username}
          </Typography>
          <Box sx={{ bgcolor: '#8b5cf615', px: 2, py: 0.5, borderRadius: '20px', mt: 1 }}>
            <Typography variant="caption" sx={{ color: '#8b5cf6', fontWeight: '900', letterSpacing: '0.05em' }}>
              {displayUser?.role?.toUpperCase()}
            </Typography>
          </Box>
        </Box>

        <Typography variant="h4" fontWeight="1000" sx={{ color: '#0f172a', mb: 0.5 }}>Face Security</Typography>
        <Typography variant="body2" sx={{ color: '#64748b', mb: 4 }}>กรุณายืนยันตัวตนด้วยใบหน้า (3 วินาที)</Typography>

        <Box sx={{ position: 'relative', width: '100%', aspectRatio: '4/3', bgcolor: '#000', borderRadius: '28px', overflow: 'hidden', boxShadow: 'inset 0 0 40px rgba(0,0,0,0.5)' }}>
          {initializing && (
            <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 10, bgcolor: 'rgba(255,255,255,0.95)' }}>
              <CircularProgress size={44} thickness={4} sx={{ color: '#8b5cf6', mb: 2 }} />
              <Typography variant="body2" fontWeight="700" sx={{ color: '#64748b' }}>กำลังเตรียมกล้องสแกน...</Typography>
            </Box>
          )}
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            onPlay={handleVideoOnPlay}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
          <Box ref={canvasContainerRef} sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }} />
        </Box>

        <Box sx={{ mt: 3, p: 2.5, borderRadius: '20px', bgcolor: '#f8fafc', border: '1px solid #e2e8f0' }}>
          <Typography variant="body1" sx={{ color: '#334155', fontWeight: '900' }}>{statusMessage}</Typography>
        </Box>
      </Paper>

      {/* Success Dialog */}
      <Dialog open={scanSuccess} TransitionComponent={Zoom} PaperProps={{ sx: { borderRadius: '32px', p: 1 } }}>
        <DialogContent sx={{ textAlign: 'center', p: 6 }}>
          <Box sx={{ width: 80, height: 80, bgcolor: '#10b98120', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 3 }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
          </Box>
          <Typography variant="h4" fontWeight="1000" sx={{ color: '#10b981', mb: 1 }}>สำเร็จ!</Typography>
          <Typography sx={{ color: '#64748b', fontWeight: 500 }}>ยืนยันตัวตนเรียบร้อย กำลังเข้าสู่ระบบ...</Typography>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 5 }}>
          <Button 
            variant="contained" 
            onClick={handleSuccessRedirect} 
            sx={{ bgcolor: '#10b981', '&:hover': { bgcolor: '#059669' }, px: 8, py: 2, borderRadius: '16px', fontWeight: 800, fontSize: '1.1rem' }}
          >
            ตกลง
          </Button>
        </DialogActions>
      </Dialog>

      {/* Error Dialog */}
      <Dialog open={scanError} TransitionComponent={Zoom} PaperProps={{ sx: { borderRadius: '32px', p: 1, maxWidth: '450px' } }}>
        <DialogContent sx={{ textAlign: 'center', p: 6 }}>
          <Box sx={{ width: 80, height: 80, bgcolor: '#ef444420', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 3 }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </Box>
          <Typography variant="h4" fontWeight="1000" sx={{ color: '#ef4444', mb: 2 }}>
            {errorType === 'wrong' ? 'ปฏิเสธการเข้าถึง!' : 'ไม่พบใบหน้า!'}
          </Typography>
          <Typography sx={{ color: '#374151', fontSize: '1.1rem', fontWeight: 600, mb: 1 }}>
            {errorType === 'wrong' 
              ? `คุณไม่ใช่ผู้ดูแลระบบของ "${currentUser?.username}"` 
              : 'ระบบไม่สามารถตรวจจับใบหน้าของคุณได้'}
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b' }}>
            {errorType === 'wrong' 
              ? 'ใบหน้าไม่ตรงกับฐานข้อมูลที่เรามีสำหรับบัญชีนี้' 
              : 'กรุณาตรวจสอบแสงสว่างและตำแหน่งใบหน้าให้อยู่ในกรอบ'}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', gap: 2, pb: 5 }}>
          <Button 
            variant="outlined" 
            onClick={handleBackToLogin} 
            sx={{ px: 4, py: 1.5, borderRadius: '12px', border: '2px solid #e2e8f0', color: '#64748b', fontWeight: 700, textTransform: 'none' }}
          >
            กดออกเพื่อไปหน้า Login
          </Button>
          <Button 
            variant="contained" 
            onClick={handleRetry} 
            sx={{ bgcolor: '#ef4444', '&:hover': { bgcolor: '#dc2626' }, px: 4, py: 1.5, borderRadius: '12px', fontWeight: 700, textTransform: 'none' }}
          >
            ลองสแกนใหม่
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default FaceScanner;
