import { Helmet } from 'react-helmet-async';

import { CONFIG } from 'src/config-global';

import { EvalView } from 'src/sections/blog/view';

// ----------------------------------------------------------------------

export default function Page() {
  return (
    <>
      <Helmet>
        <title> {`Evaluation - ${CONFIG.appName}`}</title>
      </Helmet>

      <EvalView />
    </>
  );
}
