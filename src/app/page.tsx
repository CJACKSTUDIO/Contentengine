import Hero from '@/components/dashboard/Hero'
import StatStrip from '@/components/dashboard/StatStrip'
import RecentWinners from '@/components/dashboard/RecentWinners'
import AgentCrew from '@/components/dashboard/AgentCrew'
import ActivityFeed from '@/components/dashboard/ActivityFeed'

export default function DashboardPage() {
  return (
    <>
      <Hero />
      <StatStrip />
      <RecentWinners />
      <AgentCrew />
      <ActivityFeed />
    </>
  )
}
