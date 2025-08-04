import { useState, useEffect } from 'react'
import Monetization from './components/monetization/Monetization'
import VideoGameTodoApp from './components/VideoGameTodoApp'

function App() {

  return (
    <Monetization>
      <VideoGameTodoApp />
    </Monetization>
  )
}

export default App