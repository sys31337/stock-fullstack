import React from 'react';
import { Button } from '@web/shared/components/ui/button';
import { BsBack } from 'react-icons/bs';

const SubNav = () => (
  <Button variant="outline" className="gap-2">
    <BsBack />
    Retour
  </Button>
);

export default SubNav;
