import React, { useEffect, useRef, useState } from 'react';
import logo from './logo.svg';
import './App.css';
import Player from './utils/player';
import "@lottiefiles/lottie-player";
import targetList from './index.json';
// @ts-ignore
import { OpenCvProvider, useOpenCv } from 'opencv-react';

declare global {
  interface Window { 
    Module: any; 
    player: any; 
    // cv: typeof import('mirada/dist/src/types/opencv/_types');
  }
}

// window.cv = cv;

const size = 100;

let player: any;
let json: any;
let cv: any;

const getPixelsFromCanvas = (canvas: any) => {
  var context = canvas.getContext('2d');
  var imgd = context.getImageData(0, 0, size, size);
  var pix = imgd.data;

  // for (var i = 0, n = pix.length; i < n; i += 4) {
  //   pix[i  ] = 255 - pix[i  ]; // red
  //   pix[i+1] = 255 - pix[i+1]; // green
  //   pix[i+2] = 255 - pix[i+2]; // blue
  //   // i+3 is alpha (the fourth element)
  // }

  return pix;
}

function arrayDiff(a: any, b: any) {
  let cnt = 0;
  for (let i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) {
        cnt += 1;
      }
  }
  return cnt;
};


function App() {
  const initialized = useRef(false)
  const [curerntFile, setCurrentFile] = useState('');
  const [currentCompability, setCurrentCompability] = useState('');
  let [cnt, setCnt] = useState(0);
  let [log, setLog] = useState<string[]>([]);

  useEffect(() => {
    if (initialized.current) {
      return;
    }

    initialized.current = true

    var script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = '/wasm/thorvg-wasm.js';
    document.head.appendChild(script);
  
    script.onload = _ => {
      window.Module.onRuntimeInitialized = () => {
        player = new Player();
        window.player = player;

        // start();
      };
    };

    // @ts-ignore
    window.test = async () => {
      const c = await run('/images/2464.json');
      console.log(c);
    }

    // @ts-ignore
    window.compare = compareImg;
  }, []);

  const start = async () => {
    for (const targetName of targetList) {
      let logText = '';

      setCurrentFile(targetName);
      setCurrentCompability('Checking...');

      const compability = await run(`/images/${targetName}`);
      const isCompability = compability >= 50;

      logText = `${isCompability ? '✅' : '❗'} ${targetName} - Compability: ${compability}%`;

      setCurrentCompability('' + compability + '%');
      console.info(logText);
      log.push(logText);
      
      // try {
      // } catch (err) {
      //   log.push(`⚠️ ${targetName} - OpenCV Error catched`);
      // }

      setLog(log.slice());

      // save result 
      await saveResult(logText);

      cnt += 1;
      setCnt(cnt);
    }
  }

  const run = async (name: string): Promise<number> => {
    return new Promise((resolve, reject) => { // !
      try {
        const thorvgCanvas: any = document.querySelector("#thorvg-canvas");
        const lottieCanvas: any = document.querySelector("#lottie-canvas");

        thorvgCanvas.getContext('2d').clearRect(0, 0, size, size);
        lottieCanvas.getContext('2d').clearRect(0, 0, size, size);

        setTimeout(async () => {
          await load(name);

          setTimeout(() => {
            test();
            setTimeout(() => {
              const compability = test();
              resolve(compability);
            }, 100);
          }, 100);
        }, 100);
      } catch (err) {
        reject(err);  // ! return err; => reject(err);
      }
    })
  }

  const saveResult = async (logText: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const resultBoard = document.querySelector('.result');
      const resultRow = document.querySelector('.result-row')?.cloneNode(true) as any;
      resultBoard?.appendChild(resultRow);
  
      const resultText = document.createElement('span');
      resultText.innerText = logText;
      resultRow?.appendChild(resultText);
  
      const thorvgCanvas = document.querySelector('#thorvg-canvas');
      const lottieCanvas = document.querySelector('#lottie-canvas');
      
      const thorvgCloneCanvas = thorvgCanvas?.cloneNode(true) as any;
      const lottieCloneCanvas = lottieCanvas?.cloneNode(true) as any;
  
      thorvgCloneCanvas.getContext('2d').drawImage(thorvgCanvas, 0, 0);
      lottieCloneCanvas.getContext('2d').drawImage(lottieCanvas, 0, 0);
  
      resultRow?.appendChild(thorvgCloneCanvas);
      resultRow?.appendChild(lottieCloneCanvas);

      setTimeout(() => {
        resolve();
      }, 150);
    });
  }

  const test = () => {
    // @ts-ignore
    const origin: any = document.querySelector('.lottie-player').shadowRoot.querySelector('svg');
    const img: any = document.querySelector('.lottie-img');
    
    const thorvgCanvas: any = document.querySelector("#thorvg-canvas");
    const lottieCanvas: any = document.querySelector("#lottie-canvas");

    // get svg data
    origin.setAttribute('width', `${size}px`);
    origin.setAttribute('height', `${size}px`);
    var xml = new XMLSerializer().serializeToString(origin);
    
    // make it base64
    var svg64 = btoa(xml);
    var b64Start = 'data:image/svg+xml;base64,';
    
    // prepend a "header"
    var image64 = b64Start + svg64;
    
    // set it as the source of the img element
    img.onload = function() {
        // draw the image onto the canvas
        lottieCanvas.getContext('2d').drawImage(img, 0, 0);
    }
    img.src = image64;

    // OpenCV diff
    const compabilityOpenCV = compareImg(thorvgCanvas, lottieCanvas);
    return compabilityOpenCV;

    // Pixel diff
    // const thorvgPixels = getPixelsFromCanvas(thorvgCanvas);
    // const lottiePixels = getPixelsFromCanvas(lottieCanvas);

    // const diff = arrayDiff(thorvgPixels, lottiePixels);

    // const compability = 100 - Math.ceil(diff / thorvgPixels.length * 100);
    // return compability
  }

  const load = async (name: string) => {
    // thorvg
    // let json = JSON.stringify(target);
    json = await (await fetch(name)).text();
    const blob = new Blob([json], {type:"application/json"});
    const fr = new FileReader();

    fr.addEventListener("load", (e: any) => {
      const bytes = fr.result;
      player.loadBytes(bytes);
      player.frame(0);
      player.update();
      // console.log(player.totalFrame);
    });

    fr.readAsArrayBuffer(blob);

    // lottie-player
    const lottiePlayer: any = document.querySelector("lottie-player");
    // or load via a Bodymovin JSON string/object
    lottiePlayer.load(json);
  }

  const compareImg = (img1: any, img2: any) => {
    // @ts-ignore
    const cv = window.cv;
    const mat = cv.imread(img1);
    const mat2 = cv.imread(img2);

    let srcVec = new cv.MatVector();
    srcVec.push_back(mat);
    let srcVec2 = new cv.MatVector();
    srcVec2.push_back(mat2);
    let accumulate = false;
    let channels = [0];
    let histSize = [256];
    let ranges = [0, 255];
    let hist = new cv.Mat();
    let hist2 = new cv.Mat();
    let mask = new cv.Mat();
    let color = new cv.Scalar(255, 255, 255);
    let scale = 2;
    // You can try more different parameters
    cv.calcHist(srcVec, channels, mask, hist, histSize, ranges, accumulate);
    let result = cv.minMaxLoc(hist, mask);
    let max = result.maxVal;

    const Mat = cv.Mat;

    // @ts-ignore
    let dst = new Mat.zeros(
      mat.rows, histSize[0] * scale,
      cv.CV_8UC3,
    );
    
    var hist1_values = '';
    // draw histogram
    for (let i = 0; i < histSize[0]; i++) {
        hist1_values += hist.data32F[i] + ',';
        let binVal = hist.data32F[i] * mat.rows / max;
        let point1 = new cv.Point(i * scale, mat.rows - 1);
        let point2 = new cv.Point((i + 1) * scale - 1, mat.rows - binVal);
        // cv.rectangle(dst, point1, point2, color, cv.FILLED);
    }
    console.log(hist1_values);
    
    cv.imshow('thorvg-output-canvas', dst);

    cv.calcHist(srcVec2, channels, mask, hist2, histSize, ranges, accumulate);
    result = cv.minMaxLoc(hist, mask);
    max = result.maxVal;

    // @ts-ignore
    dst = new Mat.zeros(mat.rows, histSize[0] * scale,
                            cv.CV_8UC3);
    var hist2_values = '';
    // draw histogram
    for (let i = 0; i < histSize[0]; i++) {
        hist2_values += hist2.data32F[i] + ',';
        const binVal = hist2.data32F[i] * mat.rows / max;
        const point1 = new cv.Point(i * scale, mat.rows - 1);
        const point2 = new cv.Point((i + 1) * scale - 1, mat.rows - binVal);
        // cv.rectangle(dst, point1, point2, color, cv.FILLED);
    }

    console.log(hist2_values);
    cv.imshow('lottie-output-canvas', dst);
    let compare_result = cv.compareHist(hist, hist2, 0);

    const compabilityOpenCV = compare_result * 100;
    return compabilityOpenCV;
  }

  return (
    <OpenCvProvider onLoad={(_cv: any) => cv = _cv}>
    <div className="App">
      
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        {
          cnt >= targetList.length - 1 ? <span>DONE</span>
          :
          <p>
            {curerntFile} - {currentCompability}
          </p>
        }
        <div style={{ cursor: 'pointer' }} onClick={start}>START</div>
        
        <div style={{ marginTop: 32, fontSize: 13, height: 300, overflowY: 'scroll' }}>
          {
            log.map((line, i) => <div style={{ marginBottom: 4 }}>{line}<br/></div>)
          }
        </div>
      </header>

      
      <div style={{ display: 'flex' }}>
        <canvas id="thorvg-canvas" width={size} height={size} />
        <canvas id="lottie-canvas" width={size} height={size} />

        <lottie-player
          class="lottie-player"
          // autoplay
          // loop={}
          // controls
          width={size}
          style={{ width: size, height: size }}
          mode="normal"
        />
        <img className="lottie-img" style={{ width: size, height: size }} />
      </div>
    </div>

    <div style={{ display: 'flex' }}>
      <canvas id="thorvg-output-canvas" width={512} height={512} />
      <canvas id="lottie-output-canvas" width={512} height={512} />
    </div>

    <div className='result' style={{ padding: 24 }}>
      <div className='result-row' style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
      </div>
    </div>
    </OpenCvProvider>
  );
}

export default App;
