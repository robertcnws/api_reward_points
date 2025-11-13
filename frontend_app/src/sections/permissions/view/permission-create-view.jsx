import { useCallback } from 'react';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { DashboardContent } from 'src/layouts/dashboard';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { PermissionNewEditForm } from '../permission-new-edit-form';



// ----------------------------------------------------------------------

export function PermissionCreateView() {

  const currentCustomerportalPermissionId = localStorage.getItem('currentCustomerportalPermissionId');

  const router = useRouter();

  const handleReturnList = useCallback(
    () => {
      router.push(paths.dashboard.permission.list);
    },
    [router]
  );

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={!currentCustomerportalPermissionId ? "Create a new permission" : "Edit permission"}
        links={[
          { name: 'Dashboard', href: paths.dashboard.general.analytics },
          { name: 'Permission', href: paths.dashboard.permission.list },
          { name: !currentCustomerportalPermissionId ? "Create permission" : "Edit permission" },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <PermissionNewEditForm currentCustomerportalPermissionId={currentCustomerportalPermissionId} onReturnList={handleReturnList}/>
    </DashboardContent>
  );
}
