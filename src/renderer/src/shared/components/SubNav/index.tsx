import React from 'react';
import { Button } from '@chakra-ui/react';
// import { withRouter } from '@web/shared/hooks/withRouter';
import { BsBack } from 'react-icons/bs';

const SubNav = () => (
  <Button>
    <BsBack />
    Retour
  </Button>
);

// export default withRouter(SubNav);
export default SubNav;
