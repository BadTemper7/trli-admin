import NavSection from '@/components/navigation/NavSection.jsx'
import {navigation} from '@/config/navigation.js'
import {useAuth} from '@/context/AuthContext.jsx'
export default function SidebarNav({collapsed=false,onNavigate}){const {canAccessModule}=useAuth();const groups=navigation.map(g=>({...g,items:g.items.filter(i=>canAccessModule(i.module))})).filter(g=>g.items.length);return <nav aria-label="Main navigation" className="px-3 py-4">{groups.map((group,index)=><NavSection key={group.section} section={group.section} items={group.items} collapsed={collapsed} isFirst={index===0} onNavigate={onNavigate}/>)}</nav>}
