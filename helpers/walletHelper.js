const Wallet = require("../models/walletSchema");
const AdminWallet = require("../models/adminWalletSchema");
const { v4: uuidv4 } = require("uuid");
const { customAlphabet } = require("nanoid");

const generateTransactionId = async () => {
  try {
    const chars = "0123456789ABCDEFGHILKLMNOPQRSTUVWXYZ";
    const nanoid = customAlphabet(chars, 8); // Generate 8-character alphanumeric ID
    let uniqueCode;
    do {
      uniqueCode = nanoid(); // Generate an unq ID
    } while (
      await AdminWallet.findOne({ "transactions.transactionId": uniqueCode })
    ); // Check uniqueness
   // console.log("New transaction code:", uniqueCode);
    return uniqueCode;
  } catch (error) {
    console.error("Error in creating nanoId:", error);
    throw error;
  }
};

/**
 * Add credit to user's wallet
 * @param {String} userId
 *
 * @param {Number} amount
 * @param {String} reason
 * @param {String} [orderId]
 * @param {String} [productId]
 * @param {String} [note]
 */
async function addCredit(
  userId,
  amount,
  reason,
  orderId = null,
  productId = null,
  note = ""
) {
  try {
    if (amount <= 0) {
      throw new Error("Credit amount must be greater than zero.");
    }

    let wallet = await Wallet.findOne({ userId });

    if (!wallet) {
      wallet = new Wallet({
        userId,
        balance: 0,
        transactions: [],
      });
    }

    const transaction = {
      type: "CREDIT",
      amount,
      reason,
      orderId,
      productId,
      status: "SUCCESS",
      note,
    };

    wallet.balance += amount;
    wallet.transactions.push(transaction);
    wallet.updatedAt = new Date();

    await wallet.save();

    console.log(
      `Credited ₹${amount} to user ${userId}. New balance: ₹${wallet.balance}`
    );
    return wallet;
  } catch (error) {
    console.error("Error in addCredit:", error.message);
    throw error;
  }
}

/**
 * Deduct amount from user's wallet
 * @param {String} userId
 * @param {Number} amount
 * @param {String} reason
 * @param {String} [orderId]
 * @param {String} [productId]
 * @param {String} [note]
 */
async function deductAmount(
  userId,
  amount,
  reason,
  orderId = null,
  productId = null,
  note = ""
) {
  try {
    if (amount <= 0) {
      throw new Error("Deduction amount must be greater than zero.");
    }

    const wallet = await Wallet.findOne({ userId });

    if (!wallet) {
      throw new Error("Wallet not found.");
    }

    if (wallet.balance < amount) {
      throw new Error("Insufficient wallet balance.");
    }

    const transaction = {
      type: "DEBIT",
      amount,
      reason,
      orderId,
      productId,
      status: "SUCCESS",
      note,
    };

    wallet.balance -= amount;
    wallet.transactions.push(transaction);
    wallet.updatedAt = new Date();

    await wallet.save();

    console.log(
      `Debited ₹${amount} from user ${userId}. New balance: ₹${wallet.balance}`
    );
    return wallet;
  } catch (error) {
    console.error("Error in deductAmount:", error.message);
    throw error;
  }
}

/**
 * Update the admin wallet by crediting or debiting an amount.
 * @param {String} userId - ID of the user initiating the transaction
 * @param {String} transactionType - 'Credit' or 'Debit'
 * @param {Number} amount - Amount to be credited or debited
 * @param {String} source - Transaction source ('Order Payment', 'Refund', 'Cancellation', 'Manual Adjustment')
 * @param {String} orderId - Order ID (if applicable)
 * @param {String} remarks - Additional information about the transaction
 */
const updateAdminWallet = async (
  userId,
  transactionType,
  amount,
  source,
  orderId = null,
  remarks = ""
) => {
  try {
    if (!["CREDIT", "DEBIT"].includes(transactionType)) {
      throw new Error("Invalid transaction type");
    }

    if (
      ![
        "Order Payment",
        "Refund",
        "Order_Cancellation",
        "Manual Adjustment",
      ].includes(source)
    ) {
      throw new Error("Invalid transaction source");
    }

    let adminWallet = await AdminWallet.findOne();
    if (!adminWallet) {
      adminWallet = new AdminWallet({ balance: 0, transactions: [] });
    }

    // Check balance before debiting
    if (transactionType === "DEBIT" && adminWallet.balance < amount) {
      throw new Error("Insufficient balance in admin wallet");
    }

    // Create a new transaction
    const transaction = await {
      transactionId: await generateTransactionId(),
      transactionDate: new Date(),
      user: userId,
      transactionType,
      amount,
      source,
      orderId,
      remarks,
      timeStampBalance:0

    };

    // Update wallet balance
    if (transactionType === "CREDIT") {
      adminWallet.balance += amount;
    } else {
      adminWallet.balance -= amount;
    }
    transaction.timeStampBalance=adminWallet.balance
    adminWallet.transactions.push(transaction);
    await adminWallet.save();

    console.log(`✅ Admin Wallet Updated: ${transactionType} of ₹${amount}`);
    return transaction;
  } catch (error) {
    console.error("❌ Error updating admin wallet:", error.message);
    throw error;
  }
};

module.exports = {
  addCredit,
  deductAmount,
  updateAdminWallet,
};
