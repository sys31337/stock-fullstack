import React from 'react';
import { Route, Routes } from 'react-router-dom';
import { PrivateRoute } from '@shared/components/Authentication';
import AppSection from '@shared/components/AppSection';
import './App.css';


const Authentication = React.lazy(() => import('./modules/Authentication'));
const Home = React.lazy(() => import('./modules/Home'));

const App = () => (
  <Routes>
    <Route path="connexion/*" element={<Authentication />} />
    <Route element={<AppSection />}>
      <Route
        path="/*"
        element={
          <PrivateRoute>
            <Routes>
              <Route path="*" element={<Home />} />
            </Routes>
          </PrivateRoute>
        }
      />
    </Route>
  </Routes>
);

export default App;
