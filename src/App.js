import React from 'react';
import {landGrid} from './landGrid'
import {drawMap} from './map'

function App() {
  console.log(landGrid)
  drawMap()
  return (
    <div className="App">
        Prevalence of overweight among adults, BMI ≥ 25
    </div>
  );
}

export default App;
