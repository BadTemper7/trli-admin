import { BadgeCheck, ChartNoAxesCombined, CircleDollarSign, ClipboardList, CreditCard, LayoutDashboard, LogIn, LogOut, Package, PackageCheck, Truck, ReceiptText, Settings, Users, Warehouse } from 'lucide-react';
import { MODULES } from '@/constants/permissions.js';

export const HOME_PATH = '/dashboard';
/** Reordered for the real booking journey. Every existing route/permission is preserved. */
export const navigation = [
  { section: 'Overview', items: [{title:'Dashboard',path:'/dashboard',icon:LayoutDashboard,module:MODULES.DASHBOARD}] },
  { section: 'Booking & Gate Operations', items: [
    {title:'Pre-advice',path:'/pre-advice',icon:ClipboardList,module:MODULES.PRE_ADVICE},
    {title:'Gate-in',path:'/gate-in',icon:LogIn,module:MODULES.GATE_IN},
    {title:'Storage Monitoring',path:'/storage-monitoring',icon:Warehouse,module:MODULES.STORAGE_MONITORING},
    {title:'Gate-out',path:'/gate-out',icon:LogOut,module:MODULES.GATE_OUT},
    {title:'Release Container',path:'/release-container',icon:PackageCheck,module:MODULES.RELEASE_CONTAINER},
  ]},
  { section: 'Container Records', items: [
    {title:'Inventory',path:'/inventory',icon:Package,module:MODULES.INVENTORY},
    {title:'Forwarding',path:'/forwarding',icon:Truck,module:MODULES.FORWARDING},
  ]},
  { section: 'Payments & Transactions', items: [
    {title:'Invoices & Verification',path:'/invoice-review',icon:ReceiptText,module:MODULES.PAYMENT_HISTORY},
    {title:'Payment History',path:'/payment-history',icon:ReceiptText,module:MODULES.PAYMENT_HISTORY},
    {title:'Rate Setup',path:'/rate-setup',icon:CircleDollarSign,module:MODULES.RATE_SETUP},
    {title:'Payment Types',path:'/payment-types',icon:CreditCard,module:MODULES.PAYMENT_TYPES},
  ]},
  { section: 'Administration', items: [
    {title:'Client Verification',path:'/client-verification',icon:BadgeCheck,module:MODULES.CLIENT_VERIFICATION},
    {title:'User Management',path:'/user-management',icon:Users,module:MODULES.USER_MANAGEMENT},
  ]},
  { section: 'Analytics', items: [{title:'Reports Module',path:'/reports',icon:ChartNoAxesCombined,module:MODULES.REPORTS}] },
  { section: 'System', items: [{title:'Settings',path:'/settings',icon:Settings,module:MODULES.SETTINGS}] },
];

export function firstAccessiblePath(user) {
  if (!user) return '/login';
  if (user.mustChangePassword) return '/setup-password';
  if (user.role === 'SUPER_ADMIN') return '/dashboard';
  for (const group of navigation) for (const item of group.items) {
    if (user.permissions?.some(p => p.module === item.module && p.actions?.includes('VIEW'))) return item.path;
  }
  return '/access-denied';
}
const FLAT_SECTIONS = new Set(['Overview']);
export function getBreadcrumbs(pathname) {
  const trail = [{label:'Home',path:HOME_PATH}];
  for (const group of navigation) {
    const match = group.items.find(item => pathname === item.path || pathname.startsWith(`${item.path}/`));
    if (!match) continue;
    if (!FLAT_SECTIONS.has(group.section)) trail.push({label:group.section});
    trail.push({label:match.title});
    return trail;
  }
  return trail;
}
