import { Outlet } from 'react-router-dom'
import PageContainer from './PageContainer'
import BottomNav from './BottomNav'

export default function Layout() {
  return (
    <>
      <PageContainer>
        <Outlet />
      </PageContainer>
      <BottomNav />
    </>
  )
}
