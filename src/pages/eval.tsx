import { Helmet } from 'react-helmet-async';

import { CONFIG } from 'src/config-global';

import { Outlet } from 'react-router-dom';
// ----------------------------------------------------------------------

export default function Page() {
  return (
    <>
      <Helmet>
        <title> {`Evaluation - ${CONFIG.appName}`}</title>
      </Helmet>

      <Outlet />
    </>
  );
}
