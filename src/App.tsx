import React, { useEffect, useRef, useState } from 'react';
import logo from './logo.svg';
import './App.css';
import Player from './utils/player';
import "@lottiefiles/lottie-player";
import targetList from './index.json';
// @ts-ignore
import { OpenCvProvider, useOpenCv } from 'opencv-react';
import resemble from 'resemblejs';

declare global {
  interface Window { 
    Module: any; 
    player: any; 
  }
}

const testingSize = 800;
const size = 100;
const successPercentage = 98;

let player: any;
let json: any;
let cv: any;

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

    initialized.current = true;

    var script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = '/wasm/thorvg-wasm.js';
    document.head.appendChild(script);

    script.onload = () => {
      window.Module.onRuntimeInitialized = () => {
        if (player != null) {
          return;
        }

        player = new Player();
        window.player = player;
      };
    };
  }, []);

  const start = async () => {
    // sort by name
    const targets = targetList.sort((a, b) => {
      if (a < b) {
        return -1;
      }
      return 1;
    });

    for (const targetName of targetList) {
      if (!targetName.endsWith('.json') || targetName === 'index.json') {
        continue;
      }

      let logText = '';

      setCurrentFile(targetName);
      setCurrentCompability('Checking...');

      const compability = await run(`/images/${targetName}`);
      const isCompability = compability >= successPercentage;

      logText = `${isCompability ? '✅' : '❗'} ${targetName} \n * Similarity: ${compability}%`;

      setCurrentCompability('' + compability + '%');
      console.info(logText);
      log.push(logText);

      setLog(log.slice());

      // save result 
      try {
        if (isCompability) {
          await saveResult(logText);
        } else {
          await saveError(logText);
        }
      } catch (err) {
        // TODO : save error
        console.log(err);
      }

      cnt += 1;
      setCnt(cnt);
    }
  }

  const run = async (name: string): Promise<number> => {
    return new Promise((resolve, reject) => { // !
      try {
        const thorvgCanvas: any = document.querySelector("#thorvg-canvas");
        const lottieCanvas: any = document.querySelector("#lottie-canvas");
        const diffImg: any = document.querySelector("#diff-img");

        diffImg.setAttribute('src', '');
        thorvgCanvas.getContext('2d').clearRect(0, 0, testingSize, testingSize);
        lottieCanvas.getContext('2d').clearRect(0, 0, testingSize, testingSize);

        setTimeout(async () => {
          const isLoaded = await load(name);
          if (!isLoaded) {
            resolve(0);
          }

          setTimeout(async () => {
            try {
              const compability = await test();
              resolve(compability);
            } catch (err) {
              resolve(0);
            }
          }, 100);
        }, 200);
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
      resultText.style.width = '200px';
      resultRow?.appendChild(resultText);
  
      const thorvgCanvas = document.querySelector('#thorvg-canvas');
      const lottieCanvas = document.querySelector('#lottie-canvas');
      const diffImg = document.querySelector('#diff-img');
      
      const thorvgCloneCanvas = thorvgCanvas?.cloneNode(true) as any;
      const lottieCloneCanvas = lottieCanvas?.cloneNode(true) as any;
      const diffCloneImg = diffImg?.cloneNode(true) as any;

      thorvgCloneCanvas.width = size;
      thorvgCloneCanvas.height = size;

      lottieCloneCanvas.width = size;
      lottieCloneCanvas.height = size;

      diffCloneImg.width = size;
      diffCloneImg.height = size;
  
      thorvgCloneCanvas.getContext('2d').drawImage(thorvgCanvas, 0, 0, size, size);
      lottieCloneCanvas.getContext('2d').drawImage(lottieCanvas, 0, 0, size, size);
  
      resultRow?.appendChild(thorvgCloneCanvas);
      resultRow?.appendChild(lottieCloneCanvas);
      resultRow?.appendChild(diffCloneImg);

      setTimeout(() => {
        resolve();
      }, 150);
    });
  }

  const saveError = async (logText: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const resultBoard = document.querySelector('.result-error');
      const resultRow = document.querySelector('.result-error-row')?.cloneNode(true) as any;
      resultBoard?.appendChild(resultRow);
  
      const resultText = document.createElement('span');
      resultText.style.width = '200px';
      resultText.innerText = logText;
      resultRow?.appendChild(resultText);
  
      const thorvgCanvas = document.querySelector('#thorvg-canvas');
      const lottieCanvas = document.querySelector('#lottie-canvas');
      const diffImg = document.querySelector('#diff-img');
      
      const thorvgCloneCanvas = thorvgCanvas?.cloneNode(true) as any;
      const lottieCloneCanvas = lottieCanvas?.cloneNode(true) as any;
      const diffCloneImg = diffImg?.cloneNode(true) as any;

      thorvgCloneCanvas.width = size;
      thorvgCloneCanvas.height = size;

      lottieCloneCanvas.width = size;
      lottieCloneCanvas.height = size;

      diffCloneImg.width = size;
      diffCloneImg.height = size;
  
      thorvgCloneCanvas.getContext('2d').drawImage(thorvgCanvas, 0, 0, size, size);
      lottieCloneCanvas.getContext('2d').drawImage(lottieCanvas, 0, 0, size, size);
  
      resultRow?.appendChild(thorvgCloneCanvas);
      resultRow?.appendChild(lottieCloneCanvas);
      resultRow?.appendChild(diffCloneImg);

      setTimeout(() => {
        resolve();
      }, 150);
    });
  }

  const drawSvgIntoCanvas = async (): Promise<void> => {
    return new Promise((resolve, reject) => {
      // @ts-ignore
      const svg: any = document.querySelector('.lottie-player').shadowRoot.querySelector('svg')?.cloneNode(true);
      svg.setAttribute('width', `${testingSize}px`);
      svg.setAttribute('height', `${testingSize}px`);
  
      const svgString = svg.outerHTML;
  
      const URL = window.URL || window.webkitURL || window;
      const blob = new Blob([svgString], {type:'image/svg+xml;charset=utf-8'});
  
      const blobURL = URL.createObjectURL(blob);
      const img = new Image();
  
      const canvas: any = document.querySelector("#lottie-canvas");

      img.src = blobURL;
      
      // set it as the source of the img element
      img.onload = () => {
          // draw the image onto the canvas
          canvas.getContext('2d').drawImage(img, 0, 0);
          resolve();
      }

      img.onerror = (err: any) => {
        console.error('error on loading image' + err);
        reject();
      }
    });
  }

  const test = async () => {
    const thorvgCanvas: any = document.querySelector("#thorvg-canvas");
    const lottieCanvas: any = document.querySelector("#lottie-canvas");

    // copy lottie-svg to canvas
    try {
      await drawSvgIntoCanvas();
    } catch (err) {
      console.log(err);
      return 0;
    }

    // resembleJS diff
    const compabilityWithResembleJS = await diffWithResembleJS(thorvgCanvas, lottieCanvas);
    return compabilityWithResembleJS;

    // // OpenCV diff
    // const compabilityOpenCV = compareImg(thorvgCanvas, lottieCanvas);
    // // return compabilityOpenCV;

    // // Pixel diff
    // const thorvgPixels = getPixelsFromCanvas(thorvgCanvas);
    // const lottiePixels = getPixelsFromCanvas(lottieCanvas);

    // const diff = arrayDiff(thorvgPixels, lottiePixels);

    // const compability = 100 - Math.ceil(diff / thorvgPixels.length * 100);
    // return (compability + compabilityOpenCV) / 2;
  }

  const diffWithResembleJS = async (thorvgCanvas: any, lottieCanvas: any): Promise<number> => {
    const thorvgURL = thorvgCanvas.toDataURL("image/png");
    const lottieURL = lottieCanvas.toDataURL("image/png");

    return new Promise((resolve, reject) => {
      resemble.compare(thorvgURL, lottieURL, {}, (err: any, data: any) => {
        const { misMatchPercentage, getImageDataUrl } = data;
        const diffImg = document.querySelector('#diff-img') as any;
        diffImg.src = getImageDataUrl();
        
        // console.log(data);
        resolve(100 - misMatchPercentage);
      });
    });
  }


  const load = async (name: string) => {
    return new Promise<boolean>(async (resolve, reject) => {
      // thorvg
      json = await (await fetch(name)).text();
      const lottiePlayer: any = document.querySelector("lottie-player");

      try {
        // lottie-player
        lottiePlayer.load(json);
      } catch (err) {
        console.log('Mark as an error : maybe lottie issue');
        resolve(false);
      }
  
      // check JSON
      try {
        JSON.parse(json);
      } catch (err) {
        resolve(false);
      }
  
      const blob = new Blob([json], {type:"application/json"});
      const fr = new FileReader();

      fr.onloadend = () => {
        const bytes = fr.result as any;
        console.log(bytes);
        

        try {
          player.loadBytes(bytes);

          const playerTotalFrames = Math.floor(player.totalFrame);
          const lottieTotalFrames = Math.floor(lottiePlayer.getLottie().totalFrames);
          const targetFrame = Math.floor(playerTotalFrames / 2); // Run with middle frame
        
          player.seek(targetFrame);
          lottiePlayer.seek(targetFrame);

          console.log(`totalFrames ${playerTotalFrames} ${lottieTotalFrames}`);
        } catch (err) {
          console.log(err);
          return resolve(false);
        }

        resolve(true);

        // delay if needed
        // setTimeout(() => {
        //   resolve(true);
        // }, 2000);
      };

      fr.readAsArrayBuffer(blob);
    });
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

      
      <div style={{ display: 'flex', overflowX: 'scroll', width: '100%' }}>
        <canvas id="thorvg-canvas" width={testingSize} height={testingSize} />
        <canvas id="lottie-canvas" width={testingSize} height={testingSize} />
        <img id="diff-img" width={testingSize} height={testingSize} />

        <lottie-player
          class="lottie-player"
          // autoplay
          // loop={}
          // controls
          width={testingSize + 'px'}
          style={{ width: testingSize, height: testingSize }}
          mode="normal"
        />
      </div>
    </div>

    {/* <div style={{ display: 'flex' }}>
      <canvas id="thorvg-output-canvas" width={512} height={512} />
      <canvas id="lottie-output-canvas" width={512} height={512} />
    </div> */}

    <div style={{ width: '100%', display: 'flex', flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#f6f6f6' }}>
      <div className='result-error' style={{ padding: 24 }}>
        <div className='result-error-row-first' style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'start', marginBottom: 20, fontWeight: 'bold' }}>
          <div style={{ width: 200, textAlign: 'center' }}>Name</div>
          <div style={{ width: 100, textAlign: 'center' }}>ThorVG</div>
          <div style={{ width: 100, textAlign: 'center' }}>lottie-js</div>
          <div style={{ width: 100, textAlign: 'center' }}>Diff</div>
        </div>
        <div className='result-error-row' style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', borderBottom: '1px solid #bdbdbd' }}>
        </div>
      </div>

      <div className='result' style={{ padding: 24 }}>
        <div className='result-error-row-first' style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'start', marginBottom: 20, fontWeight: 'bold' }}>
          <div style={{ width: 200, textAlign: 'center' }}>Name</div>
          <div style={{ width: 100, textAlign: 'center' }}>ThorVG</div>
          <div style={{ width: 100, textAlign: 'center' }}>lottie-js</div>
          <div style={{ width: 100, textAlign: 'center' }}>Diff</div>
        </div>
        <div className='result-row' style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', borderBottom: '1px solid #bdbdbd' }}>
        </div>
      </div>
    </div>
    </OpenCvProvider>
  );
}

export default App;
