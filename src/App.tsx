import React, { useEffect, useRef, useState } from 'react';
import logo from './logo.svg';
import './App.css';
import Player from './utils/player';
import "@lottiefiles/lottie-player";
import targetList from './index.json';

declare global {
  interface Window { Module: any; player: any }
}

const size = 100;

let player: any;
let json: any;

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
  }, []);

  const start = async () => {
    for (const targetName of targetList) {
      setCurrentFile(targetName);
      setCurrentCompability('Checking...');

      const compability = await run(`/images/${targetName}`);
      setCurrentCompability('' + compability + '%');
      console.info(`${targetName} - Compability: ${compability}%`);

      const isCompability = compability >= 40;

      log.push(`${isCompability ? '✅' : '❗'} ${targetName} - Compability: ${compability}%`);
      setLog(log.slice());

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


    // Pixel diff
    const thorvgPixels = getPixelsFromCanvas(thorvgCanvas);
    const lottiePixels = getPixelsFromCanvas(lottieCanvas);

    const diff = arrayDiff(thorvgPixels, lottiePixels);

    const compability = 100 - Math.ceil(diff / thorvgPixels.length * 100);
    return compability
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

  return (
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
  );
}

export default App;
