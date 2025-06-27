import { paths } from 'src/routes/paths';

import { useDataContext } from 'src/auth/context/data/data-context';

import { DashboardContent } from 'src/layouts/dashboard';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { StoreProductNewEditForm } from '../store-product-new-edit-form';


// ----------------------------------------------------------------------

export function StoreProductEditView() {

  const storeProductId = localStorage.getItem('storeProductId');
  
  const {
    loadedStoreProducts,
  } = useDataContext();

  const currentStoreProduct = loadedStoreProducts.find((item) => item.id === storeProductId);

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Edit store product"
        links={[
          { name: 'Dashboard', href: paths.dashboard.general.analytics },
          { name: 'Store Product', href: paths.dashboard.storeProduct.list },
          { name: 'Edit store product' },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <StoreProductNewEditForm
        currentStoreProduct={currentStoreProduct}
      />

    </DashboardContent>
  );
}
