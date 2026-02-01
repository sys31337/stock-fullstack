import React from 'react';
import { Loader2 } from 'lucide-react';

const Loading = () => (
    <div className="flex w-full h-[90vh]">
      <div className="m-auto">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    </div>
);

export default Loading;
