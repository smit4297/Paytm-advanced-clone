import express from "express";
import { z } from "zod";
import db from "@repo/db/client";

const app = express();
app.use(express.json()); // Make sure to parse incoming request bodies as JSON

// Define a Zod schema for the expected request body
const paymentInformationSchema = z.object({
  token: z.string(),
  userId: z.string(),
  amount: z.string(),
});

app.post("/hdfcWebhook", async (req, res) => {
  // Validate the incoming request body against the schema
  const validatedData = paymentInformationSchema.safeParse(req.body);

  if (!validatedData.success) {
    // If the validation failed, return an error response
    return res.status(400).json({ error: validatedData.error.message });
  }

  // If the validation succeeded, you can access the validated data
  const paymentInformation = validatedData.data;
  console.log(paymentInformation.userId)
  // Update balance in db, add txn
  try {

    
    // Check if the previous transaction status is "Processing"
    const existingTransaction = await db.onRampTransaction.findUnique({
      where: { token: paymentInformation.token },
    });

    if (!existingTransaction || existingTransaction.status !== "Processing") {
      return res.status(400).json({ error: "Invalid transaction status" });
    }else{

      await db.$transaction([
        db.balance.updateMany({
          where: { userId: Number(paymentInformation.userId) },
          data: {
            amount: {
              // You can also get this from your DB
              increment: Number(paymentInformation.amount),
            },
          },
        }),
        db.onRampTransaction.updateMany({
          where: { token: paymentInformation.token },
          data: { status: "Success" },
        }),
      ]);
      // res.json({ message: "Captured" });
      res.status(200).json({ message: "Payment processed successfully" });

    }
 
  } catch (e) {
    console.error(e);
    res.status(411).json({ message: "Error while processing webhook" });
  }
});

app.listen(3003);