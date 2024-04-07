import { getServerSession } from "next-auth";
import { SendCard } from "../../../components/SendCard";
import { authOptions } from "../../lib/auth";
import prisma from "@repo/db/client";
import { BalanceCard } from "../../../components/BalanceCard";
import { OnP2PTransactions } from "../../../components/OnP2PTransactions";

class CustomError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CustomError";
  }
}

async function getBalance() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user || !session.user.id) {
    throw new CustomError("User not authenticated");
  }

  const balance = await prisma.balance.findUnique({
    where: { userId: Number(session.user.id)  },
  });

  if (!balance) {
    throw new CustomError("User balance not found");
  }

  return { amount: balance.amount, locked: balance.locked };
}

async function getDebitP2pTransfers() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user || !session.user.id) {
    throw new CustomError("User not authenticated");
  }

  const user = await prisma.user.findUnique({
    where: { id: Number(session.user.id) },
    include: {
      sentTransfers: {
        include: {
          toUser: true,
        },
      },
    },
  });

  if (!user) {
    throw new CustomError("User not found");
  }

  return user.sentTransfers.map((t) => ({
    time: t.timestamp,
    amount: t.amount,
    fromUserNumber: user.number,
    toUserNumber: t.toUser.number,
  }));
}

async function getCreditP2pTransfers() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user || !session.user.id) {
    throw new CustomError("User not authenticated");
  }

  const user = await prisma.user.findUnique({
    where: { id: Number(session.user.id)},
    include: {
      receivedTransfers: {
        include: {
          fromUser: true,
        },
      },
    },
  });

  if (!user) {
    throw new CustomError("User not found");
  }

  return user.receivedTransfers.map((t) => ({
    time: t.timestamp,
    amount: t.amount,
    fromUserNumber: t.fromUser.number,
    toUserNumber: user.number,
  }));
}

export default async function () {
  try {
    const balance = await getBalance();
    const debitTxns = await getDebitP2pTransfers();
    const creditTxns = await getCreditP2pTransfers();

    return (
      <div className="w-screen">
        <div className="text-4xl text-[#6a51a6] pt-8 mb-8 font-bold">
          P2P Transfer
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 p-4">
          <div>
            <SendCard />
          </div>
          <div>
            <BalanceCard amount={balance.amount} locked={balance.locked} />
            <div className="pt-4">
              <OnP2PTransactions transactions={debitTxns} isDebit={true} />
            </div>
            <div className="pt-4">
              <OnP2PTransactions transactions={creditTxns} isDebit={false} />
            </div>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    if (error instanceof CustomError) {
      console.error(error);
      return (
        <div className="w-screen text-center text-red-500 text-xl">
          An error occurred: {error.message}
        </div>
      );
    } else {
      console.error(error);
      return (
        <div className="w-screen text-center text-red-500 text-xl">
          An unexpected error occurred.
        </div>
      );
    }
  }
}