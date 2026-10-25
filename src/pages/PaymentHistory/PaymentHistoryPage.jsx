import PageContainer from "@/components/layout/PageContainer.jsx"
import PageHeader from "@/components/layout/PageHeader.jsx"

function PaymentHistoryPage() {
  return (
    <PageContainer>
      <PageHeader
        title="Payment History"
        description="Review past payments"
      />

      <div className="min-h-[400px]" />
    </PageContainer>
  )
}

export default PaymentHistoryPage
