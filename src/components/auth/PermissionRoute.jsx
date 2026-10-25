import AccessDeniedPage from '@/pages/AccessDenied/AccessDeniedPage.jsx'
import {useAuth} from '@/context/AuthContext.jsx'
export default function PermissionRoute({module,action='VIEW',children}){const {can}=useAuth();return can(module,action)?children:<AccessDeniedPage/>}
