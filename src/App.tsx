import { Routes, Route } from 'react-router'
import Home from './pages/Home'
import TimeHome from './pages/TimeHome'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/time" element={<TimeHome />} />
    </Routes>
  )
}
