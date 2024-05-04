import { useAuthenticated } from '@web/shared/hooks/useAuthentication';
import React, { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';

interface Props {
  element?: ReactNode;
  children?: ReactNode;
}

export const PrivateRoute: React.FC<Props> = ({ element, children }) => {
  const isAuthenticated = useAuthenticated();
  //   const isAuthenticated = true;
  return <>{isAuthenticated ? element || children : <Navigate to="/connexion" />}</>;
};
