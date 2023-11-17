import {
  POINTS,
  keypointConnections,
  poseList,
  CLASS_NO,
  drawPoint,
  drawSegment,
  landmarks_to_embedding,
} from './ExploreStage-helper.js';

log('ExploreStage.js loaded 👍');

let webcamRef = document.querySelector('#video');
let canvasRef = document.querySelector('#canvas');

webcamRef.addEventListener(
  'loadedmetadata',
  function (e) {
    log(
      `videoWidth: ${webcamRef.videoWidth}, videoHeight: ${webcamRef.videoHeight}`
    );
    canvasRef.width = this.videoWidth;
    canvasRef.height = this.videoHeight;
  },
  false
);

webcamRef.width = window.innerWidth;
webcamRef.height = window.innerHeight;

let skeletonColor = 'rgb(255,255,255)';

const setStartingTime = val => (yogaState.startingTime = val);
const setLastTime = val => (yogaState.lastTime = val);
const setCurrentPose = val => (yogaState.currentPose = val);

async function playVideoFromCamera() {
  try {
    const constraints = {
      video: {
        width: window.innerWidth,
        height: window.innerHeight,
        facingMode: 'user',
      },
    };
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    webcamRef.srcObject = stream;
    window.playSound();
  } catch (err) {
    error('Error opening video camera.', err);
  }
}

let setIntervalDuration = 100;
let debug = false;
// debug = true;
export function initStage() {
  playVideoFromCamera()
    .then(async () => {
      if (debug) return;

      await import('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs');
      await import(
        'https://cdn.jsdelivr.net/npm/@tensorflow-models/pose-detection'
      );

      await tf.ready();

      let detectorConfig = {
        modelType: poseDetection.movenet.modelType.SINGLEPOSE_THUNDER,
      };

      const detector = await poseDetection.createDetector(
        poseDetection.SupportedModels.MoveNet,
        detectorConfig
      );

      const poses = await detector.estimatePoses(video);

      log({ detector, webcamRef, poses });
      log(`webcamRef.readyState: ${webcamRef.readyState}`);

      return detector;
    })
    .then(async detector => {
      if (debug) return;

      const poseClassifier = await tf.loadLayersModel(
        'https://models.s3.jp-tok.cloud-object-storage.appdomain.cloud/model.json'
      );

      log({ poseClassifier });

      setInterval(() => {
        // log('👽 setInterval ~ detectPose');
        detectPose(detector, poseClassifier);
      }, setIntervalDuration);
    });
}

let lastUpdateTimerVal = 15;
function updateTimer() {
  let updateTimerVal = 15 - Math.ceil(yogaState.progress / 1000);
  if (updateTimerVal !== lastUpdateTimerVal) {
    lastUpdateTimerVal = updateTimerVal;
    document.querySelector('.timer-number').textContent = updateTimerVal;
  }
}

function detectPoseFailure() {
  let diff = Date.now() - yogaState.lastTime;
  if (diff > 2000) {
    yogaState.startingTime = null;
    yogaState.progress = 0;
    document.querySelector('.timer svg circle').classList.remove('active');
  } else {
    // yogaState.lastTime = Date.now();
    yogaState.progress = yogaState.lastTime - yogaState.startingTime;
  }

  updateTimer();
}

function detectPoseSuccess() {
  if (yogaState.startingTime === null) {
    yogaState.startingTime = yogaState.lastTime = Date.now();
    document.querySelector('.timer svg circle').classList.add('active');
  } else {
    yogaState.lastTime = Date.now();
    yogaState.progress = yogaState.lastTime - yogaState.startingTime;
  }

  updateTimer();
}

async function detectPose(detector, poseClassifier) {
  const poses = await detector.estimatePoses(video);
  const ctx = canvasRef.getContext('2d');

  ctx.clearRect(0, 0, canvasRef.width, canvasRef.height);

  let notDetected = 0;
  try {
    const keypoints = poses[0].keypoints;

    let input = keypoints.map(keypoint => {
      if (keypoint.score > 0.4) {
        if (!(keypoint.name === 'left_eye' || keypoint.name === 'right_eye')) {
          drawPoint(ctx, keypoint.x, keypoint.y, 8, 'rgb(255,255,255)');

          let connections = keypointConnections[keypoint.name];
          try {
            connections.forEach(connection => {
              let conName = connection.toUpperCase();
              drawSegment(
                ctx,
                [keypoint.x, keypoint.y],
                [keypoints[POINTS[conName]].x, keypoints[POINTS[conName]].y],
                skeletonColor
              );
            });
          } catch (err) {
            detectPoseFailure(err);
          }
        }
      } else {
        notDetected += 1;
      }
      return [keypoint.x, keypoint.y];
    });

    if (notDetected > 4) {
      skeletonColor = 'rgb(255,255,255)';
      detectPoseFailure();
      // log('notDetected > 4 🚮');
      return;
    }

    // log({ input });

    const processedInput = landmarks_to_embedding(input);
    const classification = poseClassifier.predict(processedInput);

    // alert('❤️');
    // log({ classification });

    classification.array().then(data => {
      const classNo = CLASS_NO[yogaState.currentPose];

      // log('🚀 classNo', data[0][classNo]);

      if (data[0][classNo] > 0.97) {
        skeletonColor = 'rgb(0,255,0)';
        detectPoseSuccess();
        return;
      } else {
        skeletonColor = 'rgb(255,255,255)';
        detectPoseFailure();
      }
    });
  } catch (err) {
    detectPoseFailure(err);
  }

  detectPoseFailure();
}
