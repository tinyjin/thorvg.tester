import React, { useEffect, useRef } from 'react';
import logo from './logo.svg';
import './App.css';
import target from "./images/703.json";
import Player from './utils/player';
import "@lottiefiles/lottie-player";

declare global {
  interface Window { Module: any; player: any }
}

const size = 100;

let player: any;

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

        load();
      };
    };

    window.onload = () => {
      const player: any = document.querySelector("lottie-player");
      // or load via a Bodymovin JSON string/object
      player.load(
        JSON.stringify(target)
      );
    }

    // @ts-ignore
    window.test = () => {
      const thorvgCanvas: any = document.querySelector("#thorvg-canvas");
      // @ts-ignore
      const origin: any = document.querySelector('.lottie-player').shadowRoot.querySelector('svg');
      const lottieCanvas: any = document.querySelector("#lottie-canvas");
      var img: any = document.querySelector('.lottie-img');

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

      console.log('Compability: ');
      console.log((100 - Math.ceil(diff / thorvgPixels.length * 100)) + '%');
      // console.log(thorvgPixels.length);
      // console.log(lottiePixels);
    }
  }, []);

  const load = () => {
    let json = JSON.stringify(target);
    const blob = new Blob([json], {type:"application/json"});
    const fr = new FileReader();

    fr.addEventListener("load", (e: any) => {
      const bytes = fr.result;
      player.loadBytes(bytes);
      player.frame(0);
      console.log(player.totalFrame);
    });

    fr.readAsArrayBuffer(blob);
  }

  return (
    <div className="App">
      
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.tsx</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
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
