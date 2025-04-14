import crypto from "crypto";
import { config } from "../config/keys";

export function getDroneRoomId(droneId: string): string {
  const hmac = crypto.createHmac("sha256", config.roomSecret);
  hmac.update(droneId);
  return `drone_${hmac.digest("hex")}`;
}
