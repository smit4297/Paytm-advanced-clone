import { Card } from "@repo/ui/card"

export const OnP2PTransactions = ({
    transactions,
    isDebit
}: {
    transactions: {
        time: Date,
        amount: number,
        fromUserNumber: string,
        toUserNumber: string
    }[],
    isDebit: boolean
}) => {
    if (!transactions.length) {
        return <Card title="Recent Transactions">
            <div className="text-center pb-8 pt-8">
                {isDebit ? "No debit transactions" : "No credit transactions"}
            </div>
        </Card>
    }

    return <Card title="Recent Transactions">
        <div className="pt-2">
            {transactions.map(t => <div className="flex justify-between items-center py-2">
                <div className="flex-1">
                    <div className="text-sm">
                        {isDebit ? `To: ${t.toUserNumber}` : `From: ${t.fromUserNumber}`}
                    </div>
                    <div className="text-slate-600 text-xs">
                        {t.time.toDateString()}
                    </div>
                </div>
                <div className="flex-1 text-right">
                    {isDebit ? <span className="text-red-500">- &#8377; {(t.amount / 100).toFixed(2)}</span> : <span className="text-green-500">+ &#8377; {(t.amount / 100).toFixed(2)}</span>}
                </div>
            </div>)}
        </div>
    </Card>
}