import React, { useEffect, useRef } from 'react';
import logo from './logo.svg';
import './App.css';
import target from "./images/2497.json";
import Lottie from 'lottie-react';
import Player from './utils/player';

declare global {
  interface Window { Module: any; player: any }
}

let player: any;

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
  }, []);

  const load = () => {
    let json = JSON.stringify(target);
    const blob = new Blob([json], {type:"application/json"});
    const fr = new FileReader();

    fr.addEventListener("load", (e: any) => {
      const bytes = fr.result;
      player.loadBytes(bytes);
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
      
        <canvas id="image-canvas" width={800} height={800} />
        <Lottie animationData={target} loop={true} width={800} height={800} />
    </div>
  );
}

export default App;
