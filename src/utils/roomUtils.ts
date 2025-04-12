import crypto from "crypto";
import { config } from "../config/keys";

export function getMissionRoomId(missionId: string): string {
  const hmac = crypto.createHmac("sha256", config.roomSecret);
  hmac.update(missionId);
  return `mission_${hmac.digest("hex")}`;
}
