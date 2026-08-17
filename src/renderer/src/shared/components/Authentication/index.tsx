import { useAuthenticated, useIsPOSUser } from '@web/shared/hooks/useAuthentication';
import React, { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

interface Props {
  element?: ReactNode;
  children?: ReactNode;
}

export const PrivateRoute: React.FC<Props> = ({ element, children }) => {
  const isAuthenticated = useAuthenticated();
  const isPOSUser = useIsPOSUser();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/connexion" />;
  }

  if (isPOSUser && location.pathname !== '/pos') {
    return <Navigate to="/pos" replace />;
  }

  return <>{element || children}</>;
};
