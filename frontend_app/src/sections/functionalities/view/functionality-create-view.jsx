import { useCallback } from 'react';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { DashboardContent } from 'src/layouts/dashboard';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { FunctionalityNewEditForm } from '../functionality-new-edit-form';



// ----------------------------------------------------------------------

export function FunctionalityCreateView() {

  const currentFunctionalityId = localStorage.getItem('currentFunctionalityId');

  const router = useRouter();

  const handleReturnList = useCallback(
    () => {
      router.push(paths.dashboard.functionality.list);
    },
    [router]
  );

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={!currentFunctionalityId ? "Create a new functionality" : "Edit functionality"}
        links={[
          { name: 'Dashboard', href: paths.dashboard.general.analytics },
          { name: 'Functionality', href: paths.dashboard.functionality.list },
          { name: !currentFunctionalityId ? "Create functionality" : "Edit functionality" },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <FunctionalityNewEditForm currentFunctionalityId={currentFunctionalityId} onReturnList={handleReturnList}/>
    </DashboardContent>
  );
}
