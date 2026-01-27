import './App.css'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import TaskOverviewPage from './pages/TaskOverviewPage'
import TaskDetailPage from './pages/TaskDetailPage'
import TaskCompletePage from './pages/TaskCompletePage'

function App() {
  return (
    <div className="iphone-frame">
      <div className="iphone-notch"></div>
      <div className="iphone-screen">
        <Router>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/overview" element={<TaskOverviewPage />} />
            <Route path="/task/:taskId" element={<TaskDetailPage />} />
            <Route path="/task/:taskId/complete" element={<TaskCompletePage />} />
          </Routes>
        </Router>
      </div>
      <div className="iphone-power-button"></div>
      <div className="iphone-volume-buttons">
        <div className="volume-up"></div>
        <div className="volume-down"></div>
      </div>
    </div>
  )
}

export default App
