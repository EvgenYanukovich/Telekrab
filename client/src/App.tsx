import { useState, useEffect } from 'react'
import axios from 'axios'

const API_URL = 'https://api.telekrab.org/counter';

function App() {
  const [counter, setCounter] = useState<number>(0)
  const [isLoading, setIsLoading] = useState<boolean>(false)

  // Fetch initial counter value
  useEffect(() => {
    fetchCounter()
  }, [])

  const fetchCounter = async () => {
    try {
      const response = await axios.get(API_URL)
      setCounter(response.data.counter)
    } catch (error) {
      console.error('Error fetching counter:', error)
    }
  }

  const handleClick = async () => {
    if (isLoading) return
    
    setIsLoading(true)
    try {
      const response = await axios.post(API_URL)
      setCounter(response.data.counter)
    } catch (error) {
      console.error('Error incrementing counter:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center',
      minHeight: '100vh',
      gap: '20px'
    }}>
      <h1>Async Clicker</h1>
      <div style={{ 
        fontSize: '2rem', 
        fontWeight: 'bold'
      }}>
        {counter}
      </div>
      <button 
        onClick={handleClick}
        disabled={isLoading}
        style={{
          padding: '10px 20px',
          fontSize: '1.2rem',
          cursor: isLoading ? 'not-allowed' : 'pointer',
          backgroundColor: isLoading ? '#ccc' : '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          transition: 'background-color 0.3s'
        }}
      >
        {isLoading ? 'Clicking...' : 'Click me!'}
      </button>
    </div>
  )
}

export default App
