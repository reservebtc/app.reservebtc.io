// import { LearnMoreWrap } from '@/components/wrap/learn-more-wrap'

export default function LearnMoreWrapPage() {
  // Temporarily disabled wrap learn-more functionality
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Wrap Documentation Temporarily Unavailable</h1>
        <p className="text-muted-foreground">This documentation is currently under maintenance.</p>
      </div>
    </div>
  )
  
  /*
  return <LearnMoreWrap />
  */
}

export const metadata = {
  title: 'How wrBTC Works | Full-Reserve Bitcoin Model | ReserveBTC',
  description: 'Understand the Full-Reserve Bitcoin model with wrBTC certificates. Learn about risks, benefits, and the innovative trust-based system backing transferable Bitcoin.',
  keywords: 'wrBTC, Full-Reserve, Bitcoin certificates, DeFi, non-custodial, Bitcoin backing, trust model, reputation system',
  openGraph: {
    title: 'How wrBTC Works | Full-Reserve Bitcoin Model',
    description: 'Deep dive into the revolutionary Full-Reserve model where Bitcoin owners create transferable certificates while maintaining custody.',
    type: 'article',
  },
}