import cron from "node-cron";
import { UserEntitlement, ENTITLEMENT_STATUS } from "../models/userEntitlement.model.js";

/**
 * Function to transition expired entitlements to EXPIRED status.
 * Can be called manually for testing or automatically by cron.
 */
export const expireEntitlements = async () => {
  try {
    const now = new Date();
    const result = await UserEntitlement.updateMany(
      { 
        status: ENTITLEMENT_STATUS.ACTIVE, 
        isLifetime: false, 
        expiresAt: { $lt: now } 
      }, 
      { 
        $set: { status: ENTITLEMENT_STATUS.EXPIRED } 
      }
    );

    console.log(`[${new Date().toISOString()}] Expiry Cron: Transitioned ${result.modifiedCount} entitlements to EXPIRED status.`);
    return result.modifiedCount;
  } catch (error) {
    console.error("Expiry Cron Error:", error);
    throw error;
  }
};

// Schedule the job to run daily at midnight
const scheduleExpiryCron = () => {
  cron.schedule("0 0 * * *", async () => {
    console.log("Running daily entitlement expiration job...");
    await expireEntitlements();
  });
  console.log("Entitlement Expiry Cron scheduled: 0 0 * * *");
};

export { scheduleExpiryCron };
