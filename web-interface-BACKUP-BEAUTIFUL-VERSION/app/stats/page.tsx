import { StatisticsWidget } from '@/components/widgets/statistics-widget'

export default function StatsPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold">Protocol Statistics</h1>
        <p className="text-muted-foreground">
          Real-time metrics and analytics for the ReserveBTC protocol
        </p>
      </div>
      
      <StatisticsWidget />
    </div>
  )
}