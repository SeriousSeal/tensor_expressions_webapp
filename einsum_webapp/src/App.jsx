import React, { useEffect } from 'react';
import './App.css';
import EinsumTreeVisualizer from './components/EinsumTreeVisualizer.jsx';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { decompressData } from './components/utils/compression.jsx';

function App() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Get and decompress URL parameters
  const compressedExpression = searchParams.get('e');
  const compressedSizes = searchParams.get('s');

  const initialExpression = decompressData(compressedExpression);
  const initialSizes = decompressData(compressedSizes);

  // Clear URL parameters after reading them
  useEffect(() => {
    if (compressedExpression || compressedSizes) {
      // Small delay to ensure data is processed
      setTimeout(() => {
        navigate('/web_app_tensor_expressions/', { replace: true });
      }, 100);
    }
  }, [compressedExpression, compressedSizes, navigate]);

  return (
    <div className="App">
      <header className="App-header">
        <h1>Einsum Tree Visualizer</h1>
      </header>
      <main>
        <EinsumTreeVisualizer
          initialExpression={initialExpression}
          initialSizes={initialSizes}
        />
      </main>
    </div>
  );
}

export default App;
