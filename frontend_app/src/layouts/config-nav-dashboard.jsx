
import { paths } from 'src/routes/paths';

import { CONFIG } from 'src/config-global';

import { SvgColor } from 'src/components/svg-color';


// ----------------------------------------------------------------------

const icon = (name) => <SvgColor src={`${CONFIG.assetsDir}/assets/icons/navbar/${name}.svg`} />;

const ICONS = {
  job: icon('ic-job'),
  blog: icon('ic-blog'),
  chat: icon('ic-chat'),
  mail: icon('ic-mail'),
  user: icon('ic-user'),
  file: icon('ic-file'),
  lock: icon('ic-lock'),
  tour: icon('ic-tour'),
  order: icon('ic-order'),
  label: icon('ic-label'),
  blank: icon('ic-blank'),
  kanban: icon('ic-kanban'),
  folder: icon('ic-folder'),
  course: icon('ic-course'),
  banking: icon('ic-banking'),
  booking: icon('ic-booking'),
  invoice: icon('ic-invoice'),
  product: icon('ic-product'),
  calendar: icon('ic-calendar'),
  disabled: icon('ic-disabled'),
  external: icon('ic-external'),
  menuItem: icon('ic-menu-item'),
  ecommerce: icon('ic-ecommerce'),
  analytics: icon('ic-analytics'),
  dashboard: icon('ic-dashboard'),
  parameter: icon('ic-parameter'),
  item: icon('ic-item'),
  shipment: icon('ic-shipment'),
  salesOrder: icon('ic-sale-order'),
  project: icon('ic-project'),
  stage: icon('ic-stage'),
  stageTask: icon('ic-stage-task'),
  task: icon('ic-task'),
  access: icon('ic-access'),
  radar: icon('ic-radar'),
  config: icon('ic-config'),
  track: icon('ic-track'),
  defaultGuideProduct: icon('ic-guide-product'),
  service: icon('ic-service'),
  serviceIssue: icon('ic-service-issue'),
  serviceStage: icon('ic-service-stage'),
  serviceTask: icon('ic-service-task'),
  calendarOverview: icon('ic-calendar-overview'),
  measurement: icon('ic-measurements'),
  defaultMaterial: icon('ic-material'),
};

const userLogged = JSON.parse(sessionStorage.getItem('userLogged'));

// const { countLostItems } = useDataContext();

// ----------------------------------------------------------------------

export const navData = () => [
  // export const navData = (countLostItems) => [
  /**
   * Overview
   */
  {
    subheader: 'Overview',
    items: [
      { title: 'Analytics', path: paths.dashboard.general.analytics, icon: ICONS.analytics },
    ],
  },
];
