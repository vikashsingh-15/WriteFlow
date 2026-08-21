import "./App.css";

import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { v4 as uuid } from "uuid";
import Editor from "./components/Editor";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate replace to={`/${uuid()}`} />} />
        <Route path="/:id" element={<Editor />} />
      </Routes>
    </Router>
  );
}

export default App;
